# Corridor Vehicle Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the choppy animated dots on corridor segments with smooth 60fps side-view vehicles (multi-car train on rail, bobbing ship on sea, truck on road) that follow the line direction.

**Architecture:** A new imperative `VehicleLayer` React component owns a dedicated Leaflet pane containing one SVG. Vehicle SVG nodes are built once per route change; a `requestAnimationFrame` loop (no React state) positions each vehicle car by sampling a precomputed path-length table, projecting through `map.latLngToLayerPoint`, and setting SVG `transform` attributes. Pure path-sampling math lives in `src/lib/vehicle-path.ts` and is unit-tested with vitest.

**Tech Stack:** Next.js 16, React 19, react-leaflet 5 / Leaflet 1.9, TypeScript 5, vitest (new devDependency for unit tests).

**Spec:** `docs/superpowers/specs/2026-07-08-corridor-vehicle-animation-design.md`

## Global Constraints

- Vehicles are neutral colored: primary fill `#f8fafc`, secondary fill `#cbd5e1`, outline `#0f172a` — never tinted with mode colors.
- Vehicle pane zIndex is `430` (above `corridor-lines` at 420, below `corridor-markers` at 460).
- Segment selection is unchanged: 6 longest segments per route (`MAX_ANIMATED_SEGMENTS_PER_ROUTE = 6`), stagger offset `animationIndex * 0.33`, speed from `route.animationSpeed`, only routes with `status === "active"`, gated by the `showFlowAnimation` prop.
- `prefers-reduced-motion: reduce` must disable the animation entirely.
- Vehicle SVG is non-interactive: `pointer-events: none` on the pane, `aria-hidden="true"` on the SVG.
- Run `npx tsc --noEmit` and `npm run lint` before each commit that touches `.ts`/`.tsx` files.

---

### Task 1: Vitest setup + path-sampling helpers (`vehicle-path.ts`)

**Files:**
- Modify: `package.json` (add vitest devDependency + `test` script)
- Create: `vitest.config.ts`
- Create: `src/lib/vehicle-path.test.ts`
- Create: `src/lib/vehicle-path.ts`

**Interfaces:**
- Consumes: `Coordinate` type (`[lat, lng]` tuple) from `@/types/map`.
- Produces (used by Task 2's `VehicleLayer`):
  - `createPathSampler(coordinates: Coordinate[]): PathSampler` where `PathSampler = { totalLength: number; pointAt(distance: number): Coordinate }`. `totalLength` is in lat/lng-degree units (planar `Math.hypot`, same convention as the existing `interpolateAlongPath`). `pointAt` clamps distance to `[0, totalLength]`.
  - `headingDegrees(from: {x: number; y: number}, to: {x: number; y: number}): number` — screen-space heading, 0° = rightward, 90° = downward (SVG y-axis), range (-180, 180].
  - `isLeftward(headingDeg: number): boolean` — true when the normalized heading is strictly between 90° and 270° (vehicle must be vertically flipped so it isn't upside-down).

- [ ] **Step 1: Install vitest and add the test script**

```bash
cd /Users/s.ahmadpur/Development/ADY/pobmap
npm install --save-dev vitest
```

Then in `package.json` add to `"scripts"` (after `"lint"`):

```json
    "test": "vitest run",
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 3: Write the failing tests**

Create `src/lib/vehicle-path.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  createPathSampler,
  headingDegrees,
  isLeftward,
} from "@/lib/vehicle-path";
import type { Coordinate } from "@/types/map";

describe("createPathSampler", () => {
  // L-shaped path: 3 units right, then 4 units up. Total length 7.
  const lPath: Coordinate[] = [
    [0, 0],
    [0, 3],
    [4, 3],
  ];

  it("computes total length of a polyline", () => {
    expect(createPathSampler(lPath).totalLength).toBe(7);
  });

  it("returns endpoints at distance 0 and totalLength", () => {
    const sampler = createPathSampler(lPath);
    expect(sampler.pointAt(0)).toEqual([0, 0]);
    expect(sampler.pointAt(7)).toEqual([4, 3]);
  });

  it("interpolates within a span", () => {
    const sampler = createPathSampler(lPath);
    expect(sampler.pointAt(1.5)).toEqual([0, 1.5]);
    expect(sampler.pointAt(5)).toEqual([2, 3]);
  });

  it("returns the corner point exactly at a span boundary", () => {
    expect(createPathSampler(lPath).pointAt(3)).toEqual([0, 3]);
  });

  it("clamps distances outside [0, totalLength]", () => {
    const sampler = createPathSampler(lPath);
    expect(sampler.pointAt(-2)).toEqual([0, 0]);
    expect(sampler.pointAt(99)).toEqual([4, 3]);
  });

  it("handles a minimal 2-point path", () => {
    const sampler = createPathSampler([
      [10, 10],
      [10, 20],
    ]);
    expect(sampler.totalLength).toBe(10);
    expect(sampler.pointAt(5)).toEqual([10, 15]);
  });

  it("skips zero-length spans without producing NaN", () => {
    const sampler = createPathSampler([
      [0, 0],
      [0, 0],
      [0, 2],
    ]);
    expect(sampler.totalLength).toBe(2);
    expect(sampler.pointAt(1)).toEqual([0, 1]);
  });

  it("degenerates gracefully for single-point and empty input", () => {
    expect(createPathSampler([[5, 6]]).pointAt(3)).toEqual([5, 6]);
    expect(createPathSampler([]).totalLength).toBe(0);
  });
});

describe("headingDegrees", () => {
  it("is 0 for rightward motion", () => {
    expect(headingDegrees({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
  });

  it("is 90 for downward motion (SVG y-axis)", () => {
    expect(headingDegrees({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe(90);
  });

  it("is 180 for leftward motion", () => {
    expect(headingDegrees({ x: 10, y: 0 }, { x: 0, y: 0 })).toBe(180);
  });

  it("is -90 for upward motion", () => {
    expect(headingDegrees({ x: 0, y: 10 }, { x: 0, y: 0 })).toBe(-90);
  });
});

describe("isLeftward", () => {
  it("is false for rightward headings", () => {
    expect(isLeftward(0)).toBe(false);
    expect(isLeftward(89)).toBe(false);
    expect(isLeftward(-89)).toBe(false);
  });

  it("is true for leftward headings", () => {
    expect(isLeftward(180)).toBe(true);
    expect(isLeftward(91)).toBe(true);
    expect(isLeftward(-91)).toBe(true);
    expect(isLeftward(269)).toBe(true);
  });

  it("is false at the vertical boundaries", () => {
    expect(isLeftward(90)).toBe(false);
    expect(isLeftward(270)).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/vehicle-path` (module does not exist).

- [ ] **Step 5: Implement `src/lib/vehicle-path.ts`**

```ts
import type { Coordinate } from "@/types/map";

export interface PathSampler {
  totalLength: number;
  pointAt(distance: number): Coordinate;
}

// Distances use the same planar lat/lng-degree convention as
// interpolateAlongPath in map-utils.ts; the layer only needs relative
// positions along a path, not real-world meters.
export function createPathSampler(coordinates: Coordinate[]): PathSampler {
  const cumulative: number[] = [0];

  for (let index = 1; index < coordinates.length; index += 1) {
    const [previousLat, previousLng] = coordinates[index - 1];
    const [lat, lng] = coordinates[index];
    cumulative.push(
      cumulative[index - 1] + Math.hypot(lat - previousLat, lng - previousLng),
    );
  }

  const totalLength = coordinates.length > 1 ? cumulative[cumulative.length - 1] : 0;

  function pointAt(distance: number): Coordinate {
    if (coordinates.length === 0) {
      return [0, 0];
    }

    if (coordinates.length === 1 || totalLength === 0) {
      return coordinates[0];
    }

    const target = Math.min(Math.max(distance, 0), totalLength);

    let low = 0;
    let high = cumulative.length - 1;

    while (low < high) {
      const mid = (low + high) >> 1;

      if (cumulative[mid] < target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const upper = Math.max(1, low);
    const spanStart = cumulative[upper - 1];
    const spanLength = cumulative[upper] - spanStart;
    const spanProgress = spanLength === 0 ? 0 : (target - spanStart) / spanLength;
    const [startLat, startLng] = coordinates[upper - 1];
    const [endLat, endLng] = coordinates[upper];

    return [
      startLat + (endLat - startLat) * spanProgress,
      startLng + (endLng - startLng) * spanProgress,
    ];
  }

  return { totalLength, pointAt };
}

export function headingDegrees(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

export function isLeftward(headingDeg: number): boolean {
  const normalized = ((headingDeg % 360) + 360) % 360;

  return normalized > 90 && normalized < 270;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests green.

- [ ] **Step 7: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add package.json package-lock.json vitest.config.ts src/lib/vehicle-path.ts src/lib/vehicle-path.test.ts
git commit -m "feat: add path sampler helpers and vitest setup for vehicle animation"
```

---

### Task 2: `VehicleLayer` component

**Files:**
- Create: `src/components/map/vehicle-layer.tsx`

**Interfaces:**
- Consumes: `createPathSampler`, `headingDegrees`, `isLeftward`, `PathSampler` from `@/lib/vehicle-path` (Task 1); `getSegmentRenderCoordinates` from `@/lib/map-utils`; `useMap` from react-leaflet.
- Produces: `VehicleLayer` React component, default-less named export, props `{ routes: CorridorRoute[] }`. Renders `null`; all drawing is imperative. Task 3 mounts it inside `MapContainer` as `<VehicleLayer routes={...} />` gated by `showFlowAnimation`.

This task is verified by typecheck/lint plus the browser verification in Task 4 (there is no DOM test infrastructure; the pure math is already covered by Task 1).

- [ ] **Step 1: Create `src/components/map/vehicle-layer.tsx`**

```tsx
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
import type { CorridorRoute, TransportMode } from "@/types/map";

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

// Measures how many path-length units correspond to one screen pixel by
// sampling the path and summing projected distances. Cheap enough to run on
// every zoomend.
function measurePathUnitsPerPx(
  map: L.Map,
  sampler: PathSampler,
): number {
  const SAMPLES = 16;
  let pixelLength = 0;
  let previous = map.latLngToLayerPoint(sampler.pointAt(0));

  for (let index = 1; index <= SAMPLES; index += 1) {
    const point = map.latLngToLayerPoint(
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

          const point = map.latLngToLayerPoint(sampler.pointAt(distance));
          const before = map.latLngToLayerPoint(
            sampler.pointAt(distance - headingEps),
          );
          const after = map.latLngToLayerPoint(
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
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/map/vehicle-layer.tsx
git commit -m "feat: add VehicleLayer with rAF-driven train/ship/truck animation"
```

---

### Task 3: Wire `VehicleLayer` into the map, remove the old flow-dot code

**Files:**
- Modify: `src/components/map/corridor-map-canvas.tsx` (remove lines ~82-108 `FLOW_ARROW_DIMENSIONS`/`createFlowIcon`, ~394-463 `getPathLength`/`FlowMarkers`, swap usage at ~660-664)
- Modify: `src/lib/map-utils.ts` (remove now-unused `interpolateAlongPath`)
- Modify: `src/app/globals.css` (remove `.flow-icon*` rules ~lines 330-390 and `@keyframes flow-arrow-*` ~lines 392-425)

**Interfaces:**
- Consumes: `VehicleLayer` from Task 2.
- Produces: the running app renders vehicles instead of dots. No new exports.

- [ ] **Step 1: Swap the component usage in `corridor-map-canvas.tsx`**

Replace:

```tsx
      {showFlowAnimation ? (
        <FlowMarkers
          routes={routes.filter((route) => route.status === "active")}
        />
      ) : null}
```

with:

```tsx
      {showFlowAnimation ? (
        <VehicleLayer
          routes={routes.filter((route) => route.status === "active")}
        />
      ) : null}
```

Add the import alongside the other `@/components` / `@/lib` imports:

```tsx
import { VehicleLayer } from "@/components/map/vehicle-layer";
```

- [ ] **Step 2: Delete dead code from `corridor-map-canvas.tsx`**

Remove entirely:
- `FLOW_ARROW_DIMENSIONS` constant and `createFlowIcon` function (the block currently at lines 82-108).
- `MAX_ANIMATED_SEGMENTS_PER_ROUTE`, `getPathLength`, and the whole `FlowMarkers` component (the block currently at lines 394-463).
- Now-unused imports: `interpolateAlongPath` from `@/lib/map-utils`, and — only if nothing else in the file still uses them after the removal — `useState` from react and `Coordinate` from `@/types/map`. Check with the typechecker rather than guessing; `useEffect`, `useMemo`, `L`, and `getSegmentRenderCoordinates` ARE still used elsewhere in the file and must stay.

- [ ] **Step 3: Delete `interpolateAlongPath` from `src/lib/map-utils.ts`**

Remove the exported function `interpolateAlongPath` (lines 69-108). `getDistance`, `softenCorners`, `getSegmentRenderCoordinates`, and `flattenRouteCoordinates` stay.

- [ ] **Step 4: Delete the flow-icon CSS from `src/app/globals.css`**

Remove these blocks (currently lines ~330-425): `.flow-icon-wrapper`, `.flow-icon`, `.flow-icon__shadow`, `.flow-icon__dot`, `.flow-icon--road .flow-icon__dot`, `.flow-icon--rail .flow-icon__dot`, `.flow-icon--ship .flow-icon__dot`, `@keyframes flow-arrow-ship`, `@keyframes flow-arrow-road`, `@keyframes flow-arrow-rail`. Verify nothing else references `flow-icon` or `flow-arrow` afterwards:

```bash
grep -rn "flow-icon\|flow-arrow" src/
```

Expected: **no matches at all**.

- [ ] **Step 5: Verify the build**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all pass, no unused-variable warnings.

- [ ] **Step 6: Commit**

```bash
git add src/components/map/corridor-map-canvas.tsx src/lib/map-utils.ts src/app/globals.css
git commit -m "feat: replace flow dots with animated corridor vehicles"
```

---

### Task 4: Manual browser verification

**Files:**
- None modified (fix-ups go into the files from Tasks 1-3 if problems surface).

**Interfaces:**
- Consumes: the running dev server (`npm run dev`, Next.js default port 3000).
- Produces: verified feature; screenshots/observations reported to the user.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: Next.js dev server ready on http://localhost:3000 (if 3000 is taken it picks the next port — read it from the output).

- [ ] **Step 2: Verify in the browser** (use the Chrome DevTools or Playwright MCP tools)

Open http://localhost:3000 and confirm, on the corridor map:

1. Trains (4 cars) run along rail segments, snaking around curves; ships (with a gentle bob) on dashed sea segments; trucks on road segments.
2. Motion is smooth (no 8fps stutter) — visually compare against scroll/zoom smoothness.
3. Vehicles are never upside-down: watch a segment that heads right-to-left and confirm the vehicle is flipped upright.
4. Pan the map — vehicles stay glued to their lines. Zoom in/out — vehicles keep a constant on-screen size and the train neither stretches nor bunches after `zoomend`.
5. Vehicles fade out/in at segment ends (no teleporting half-trains).
6. Toggle the flow-animation control in the UI off and on — vehicles disappear/reappear cleanly, no console errors.
7. Check the browser console for errors or warnings from the layer.
8. Performance spot-check: with all corridors visible, interaction (pan/zoom) remains fluid; no runaway CPU in the performance panel.

- [ ] **Step 3: Report results and fix anything broken**

Any defect found: fix in the owning file, re-run `npx tsc --noEmit && npm run lint && npm test`, re-verify in the browser, and commit the fix with a `fix:` message.
