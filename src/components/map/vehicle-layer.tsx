"use client";

import { useEffect } from "react";
import type * as L from "leaflet";
import { useMap } from "react-leaflet";

import { getSegmentRenderCoordinates } from "@/lib/map-utils";
import {
  createPathSampler,
  headingDegrees,
  isLeftward,
  type PathSampler,
} from "@/lib/vehicle-path";
import type { Coordinate, CorridorRoute, TransportMode } from "@/types/map";

const SVG_NS = "http://www.w3.org/2000/svg";
const VEHICLE_PANE = "corridor-vehicles";
const MAX_ANIMATED_SEGMENTS_PER_ROUTE = 6;
const TRAIN_CAR_SPACING_PX = 19;
const EDGE_FADE_PX = 12;
const HEADING_SAMPLE_PX = 2;

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
  speed: number;
  offset: number;
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

    const vehicles: AnimatedVehicle[] = routes.flatMap((route) =>
      route.segments
        .map((segment) => ({
          segment,
          sampler: createPathSampler(getSegmentRenderCoordinates(segment)),
        }))
        .filter(({ sampler }) => sampler.totalLength > 0)
        .sort((a, b) => b.sampler.totalLength - a.sampler.totalLength)
        .slice(0, MAX_ANIMATED_SEGMENTS_PER_ROUTE)
        .map(({ segment, sampler }, animationIndex) => ({
          ...VEHICLE_BUILDERS[segment.mode](svg),
          sampler,
          speed: route.animationSpeed,
          offset: animationIndex * 0.33,
          pathUnitsPerPx: measurePathUnitsPerPx(map, sampler),
        })),
    );

    const refreshScales = () => {
      vehicles.forEach((vehicle) => {
        vehicle.pathUnitsPerPx = measurePathUnitsPerPx(map, vehicle.sampler);
      });
    };

    map.on("zoomend", refreshScales);

    let frameId = 0;

    const frame = (now: number) => {
      const seconds = now / 1000;

      vehicles.forEach((vehicle) => {
        const { sampler, cars, pathUnitsPerPx } = vehicle;
        const spacingUnits = vehicle.carSpacingPx * pathUnitsPerPx;
        const fadeUnits = EDGE_FADE_PX * pathUnitsPerPx;
        const headingEps = HEADING_SAMPLE_PX * pathUnitsPerPx;
        const trainSpanUnits = (cars.length - 1) * spacingUnits;
        const cycleUnits = sampler.totalLength + trainSpanUnits;
        const progress = ((seconds * vehicle.speed + vehicle.offset) % 1 + 1) % 1;
        const headDistance = progress * cycleUnits;
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

          const point = toLayerPoint(map, sampler.pointAt(distance));
          const before = toLayerPoint(
            map,
            sampler.pointAt(distance - headingEps),
          );
          const after = toLayerPoint(
            map,
            sampler.pointAt(distance + headingEps),
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
      map.off("zoomend", refreshScales);
      svg.remove();
    };
  }, [map, routes]);

  return null;
}
