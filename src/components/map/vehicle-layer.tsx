"use client";

import { useEffect } from "react";
import type * as L from "leaflet";
import { useMap } from "react-leaflet";

import {
  createPathSampler,
  headingDegrees,
  isLeftward,
  type PathSampler,
} from "@/lib/vehicle-path";
import { planVehicles } from "@/lib/vehicle-plan";
import type { Coordinate, CorridorRoute, TransportMode } from "@/types/map";

const SVG_NS = "http://www.w3.org/2000/svg";
const VEHICLE_PANE = "corridor-vehicles";
const TRAIN_CAR_SPACING_PX = 19;
const EDGE_FADE_PX = 12;
const HEADING_SAMPLE_PX = 2;
// `animationSpeed` is authored as cycles per second, which made apparent speed
// depend on both zoom and path length: a vehicle crossed its whole path in
// 1/speed seconds however many pixels that path covered on screen. Zooming in
// stretched the path and sent the vehicles racing. Converting through a
// reference path width turns the same authored number into a screen speed, so
// a route reads the same at every zoom level and short legs no longer crawl
// while long hauls sprint. 0.1 (the admin default) lands at ~32 px/s.
const REFERENCE_PATH_PX = 320;
// Frames after a backgrounded tab or a long paint arrive with a huge delta;
// advancing by it would teleport every vehicle. Kept well above a slow device's
// frame time -- clamping tighter than the real frame interval would silently
// scale the whole animation down on anything that cannot hit 60fps.
const MAX_FRAME_SECONDS = 0.25;

const FILL_PRIMARY = "#f8fafc";
const FILL_SECONDARY = "#cbd5e1";
const OUTLINE = "#0f172a";

interface VehicleNodes {
  group: SVGGElement;
  cars: SVGGElement[];
  carSpacingPx: number;
  bob: boolean;
}

interface AnimatedVehicle extends VehicleNodes {
  sampler: PathSampler;
  // Screen pixels per second, held constant across zoom levels.
  pixelsPerSecond: number;
  // Where the head sits along the path, in path-length units. Advanced
  // incrementally rather than derived from absolute time so that a zoom change
  // -- which changes how fast path units are consumed -- moves the vehicle on
  // from where it is instead of snapping it to a new phase.
  distance: number;
  // Fraction of the cycle to start at, applied on the first frame once the
  // cycle length is known.
  startFraction: number;
  seeded: boolean;
  // Travels end-of-path to start-of-path. Decided per corridor in vehicle-plan.
  reversed: boolean;
  // Path-length units per screen pixel at the current zoom; refreshed on zoomend.
  pathUnitsPerPx: number;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number>,
  parent?: SVGElement,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  parent?.appendChild(element);

  return element;
}

function buildTrain(svg: SVGSVGElement): VehicleNodes {
  const group = svgElement("g", {}, svg);
  const cars: SVGGElement[] = [];

  for (let index = 0; index < 4; index += 1) {
    const car = svgElement("g", { opacity: 0 }, group);
    const isLocomotive = index === 0;

    svgElement(
      "rect",
      {
        x: -8,
        y: isLocomotive ? -5.5 : -4.5,
        width: 16,
        height: isLocomotive ? 11 : 9,
        rx: 2.5,
        fill: isLocomotive ? FILL_PRIMARY : FILL_SECONDARY,
        stroke: OUTLINE,
        "stroke-width": 1.2,
      },
      car,
    );

    if (isLocomotive) {
      svgElement(
        "rect",
        { x: 2, y: -3, width: 4, height: 6, rx: 1, fill: OUTLINE },
        car,
      );
    }

    cars.push(car);
  }

  return { group, cars, carSpacingPx: TRAIN_CAR_SPACING_PX, bob: false };
}

function buildShip(svg: SVGSVGElement): VehicleNodes {
  const group = svgElement("g", {}, svg);
  const hull = svgElement("g", { opacity: 0 }, group);

  svgElement(
    "path",
    {
      d: "M -13 -1 L 13 -1 L 8 6 L -8 6 Z",
      fill: FILL_PRIMARY,
      stroke: OUTLINE,
      "stroke-width": 1.2,
    },
    hull,
  );
  svgElement(
    "rect",
    {
      x: -5,
      y: -7,
      width: 10,
      height: 6,
      rx: 1.5,
      fill: FILL_SECONDARY,
      stroke: OUTLINE,
      "stroke-width": 1,
    },
    hull,
  );

  return { group, cars: [hull], carSpacingPx: 0, bob: true };
}

function buildTruck(svg: SVGSVGElement): VehicleNodes {
  const group = svgElement("g", {}, svg);
  const body = svgElement("g", { opacity: 0 }, group);

  svgElement(
    "rect",
    {
      x: -11,
      y: -5,
      width: 15,
      height: 10,
      rx: 2,
      fill: FILL_SECONDARY,
      stroke: OUTLINE,
      "stroke-width": 1.2,
    },
    body,
  );
  svgElement(
    "rect",
    {
      x: 5,
      y: -4,
      width: 7,
      height: 9,
      rx: 2,
      fill: FILL_PRIMARY,
      stroke: OUTLINE,
      "stroke-width": 1.2,
    },
    body,
  );

  return { group, cars: [body], carSpacingPx: 0, bob: false };
}

const VEHICLE_BUILDERS: Record<
  TransportMode,
  (svg: SVGSVGElement) => VehicleNodes
> = {
  rail: buildTrain,
  ship: buildShip,
  road: buildTruck,
};

// map.latLngToLayerPoint rounds to whole pixels, which makes slow vehicles
// step visibly and lets the closely-spaced heading samples oscillate by
// several degrees per frame; project without rounding instead.
function toLayerPoint(map: L.Map, coordinate: Coordinate): L.Point {
  return map.project(coordinate).subtract(map.getPixelOrigin());
}

// Measures how many path-length units correspond to one screen pixel by
// sampling the path and summing projected distances. Cheap enough to run on
// every zoomend.
function measurePathUnitsPerPx(
  map: L.Map,
  sampler: PathSampler,
): number {
  const SAMPLES = 16;
  let pixelLength = 0;
  let previous = toLayerPoint(map, sampler.pointAt(0));

  for (let index = 1; index <= SAMPLES; index += 1) {
    const point = toLayerPoint(
      map,
      sampler.pointAt((sampler.totalLength * index) / SAMPLES),
    );
    pixelLength += previous.distanceTo(point);
    previous = point;
  }

  return pixelLength > 0 ? sampler.totalLength / pixelLength : 0;
}

export function VehicleLayer({ routes }: { routes: CorridorRoute[] }) {
  const map = useMap();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (!map.getPane(VEHICLE_PANE)) {
      const pane = map.createPane(VEHICLE_PANE);
      pane.style.zIndex = "430";
      pane.style.pointerEvents = "none";
    }

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.style.overflow = "visible";
    svg.style.top = "0";
    svg.style.left = "0";
    map.getPane(VEHICLE_PANE)!.appendChild(svg);

    const vehicles: AnimatedVehicle[] = planVehicles(routes).map(
      (plan, animationIndex) => {
        const sampler = createPathSampler(plan.coordinates);

        return {
          ...VEHICLE_BUILDERS[plan.mode](svg),
          sampler,
          pixelsPerSecond: plan.speed * REFERENCE_PATH_PX,
          distance: 0,
          startFraction: (animationIndex * 0.33) % 1,
          seeded: false,
          reversed: plan.reversed,
          pathUnitsPerPx: measurePathUnitsPerPx(map, sampler),
        };
      },
    );

    // Tracked against the zoom the scales were measured at rather than driven
    // off `zoomend`: the layer can mount before the map settles on its final
    // zoom (route selection fits bounds right after), and a stale scale now
    // shows up directly as a wrong travel speed rather than as slightly-off
    // car spacing.
    let measuredZoom = map.getZoom();

    const refreshScales = () => {
      vehicles.forEach((vehicle) => {
        vehicle.pathUnitsPerPx = measurePathUnitsPerPx(map, vehicle.sampler);
      });
    };

    let frameId = 0;
    let previousNow = 0;

    const frame = (now: number) => {
      const seconds = now / 1000;
      const elapsed = previousNow
        ? Math.min((now - previousNow) / 1000, MAX_FRAME_SECONDS)
        : 0;
      previousNow = now;

      const zoom = map.getZoom();

      if (zoom !== measuredZoom) {
        measuredZoom = zoom;
        refreshScales();
      }

      vehicles.forEach((vehicle) => {
        const { sampler, cars, pathUnitsPerPx } = vehicle;
        const spacingUnits = vehicle.carSpacingPx * pathUnitsPerPx;
        const fadeUnits = EDGE_FADE_PX * pathUnitsPerPx;
        const headingEps = HEADING_SAMPLE_PX * pathUnitsPerPx;
        const trainSpanUnits = (cars.length - 1) * spacingUnits;
        const cycleUnits = sampler.totalLength + trainSpanUnits;

        if (!vehicle.seeded) {
          vehicle.distance = vehicle.startFraction * cycleUnits;
          vehicle.seeded = true;
        }

        // Constant screen speed: converting pixels per second into path units
        // through the current zoom's scale keeps the vehicle moving at the same
        // apparent pace however far the map is zoomed in.
        vehicle.distance += elapsed * vehicle.pixelsPerSecond * pathUnitsPerPx;

        if (cycleUnits > 0) {
          vehicle.distance %= cycleUnits;
        }

        const headDistance = vehicle.distance;
        const bobOffset = vehicle.bob ? Math.sin(seconds * 2.2) * 1.4 : 0;

        cars.forEach((car, carIndex) => {
          const distance = headDistance - carIndex * spacingUnits;

          if (distance < 0 || distance > sampler.totalLength) {
            car.setAttribute("opacity", "0");
            return;
          }

          const edgeDistance = Math.min(
            distance,
            sampler.totalLength - distance,
          );
          const opacity =
            fadeUnits > 0 ? Math.min(1, edgeDistance / fadeUnits) : 1;

          const pathDistance = vehicle.reversed
            ? sampler.totalLength - distance
            : distance;
          const aheadSign = vehicle.reversed ? -1 : 1;
          const point = toLayerPoint(map, sampler.pointAt(pathDistance));
          const before = toLayerPoint(
            map,
            sampler.pointAt(pathDistance - aheadSign * headingEps),
          );
          const after = toLayerPoint(
            map,
            sampler.pointAt(pathDistance + aheadSign * headingEps),
          );
          const heading = headingDegrees(before, after);
          const flip = isLeftward(heading) ? " scale(1,-1)" : "";

          car.setAttribute("opacity", opacity.toFixed(2));
          car.setAttribute(
            "transform",
            `translate(${point.x},${point.y + bobOffset}) rotate(${heading.toFixed(1)})${flip}`,
          );
        });
      });

      frameId = window.requestAnimationFrame(frame);
    };

    frameId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(frameId);
      svg.remove();
    };
  }, [map, routes]);

  return null;
}
