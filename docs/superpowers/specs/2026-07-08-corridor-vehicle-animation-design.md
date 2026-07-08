# Corridor Vehicle Animation — Design

**Date:** 2026-07-08
**Status:** Approved by design discussion (visual mockups reviewed in brainstorm session)

## Summary

Replace the current animated "moving dots" on corridor segments with small side-view
vehicles that travel along the lines at smooth 60fps: a multi-car train on rail
segments, a ship on sea segments, and a truck on road segments. Vehicles are neutral
(white/light fills with dark outlines) and rotate to follow the track direction.

## Background

Today, `FlowMarkers` in `src/components/map/corridor-map-canvas.tsx` renders one
Leaflet `divIcon` marker per animated segment (a small white pill) and moves it by
re-rendering React state every 120ms (~8fps). The result reads as an abstract pulsing
dot and the motion is choppy. Decisions made during brainstorming (with live animated
mockups):

- **Style:** side-view vehicles that follow the line ("little train" option), not a
  glyph badge, not a flowing-dash line effect.
- **Mode-specific:** train on `rail`, ship on `ship`, truck on `road` segments.
- **Color:** neutral vehicles (white/light + dark outline), NOT tinted with mode
  colors. The line color alone communicates the mode (rail `#E8A838`, ship
  `#3B8ED4`, road `#5CB85C`).
- **Motion quality:** move from the 120ms React tick to a `requestAnimationFrame`
  loop.

## What the user sees

- On each animated segment, one vehicle travels along the line, oriented to the
  local track direction:
  - **Rail:** a 4-car train — white locomotive (with a dark window block) + 3
    light-grey wagons, each car rotating independently so the train snakes along
    curves. Cars are rounded rectangles roughly 16×11px (locomotive) / 16×9px
    (wagons) with ~19px spacing along the path.
  - **Ship:** a single hull (trapezoid, ~26px wide) with a small superstructure,
    plus a subtle sinusoidal vertical bob (~1.5px amplitude).
  - **Road:** a cab + trailer truck (~23px total).
- Vehicles flip vertically when heading left (|heading| > 90°) so they are never
  upside-down.
- Vehicles keep a fixed on-screen size regardless of zoom (same behavior as the
  current dots).
- At segment ends, the vehicle fades out and re-enters at the start — no abrupt
  wrap or visible teleport of a half-train.
- Segment selection is unchanged: the 6 longest segments per route
  (`MAX_ANIMATED_SEGMENTS_PER_ROUTE`), staggered starting offsets, per-route
  `animationSpeed`, gated by the existing `showFlowAnimation` prop.

## Architecture

### New component: `VehicleLayer`

Replaces `FlowMarkers`. New file `src/components/map/vehicle-layer.tsx`,
rendered by `corridor-map-canvas.tsx` inside the `MapContainer`.

- Creates a dedicated Leaflet pane (zIndex ≈ 430: above `corridor-lines`, below
  stop markers) containing a single `<svg>` element sized/positioned to the map
  view.
- **Build once:** on mount (and when `routes` changes), constructs one SVG `<g>`
  node per vehicle car (rail = 4 nodes, ship/road = 1 node). No per-frame DOM
  creation.
- **Animate outside React:** a `requestAnimationFrame` loop computes, per car:
  1. distance along path from elapsed time, route speed, and stagger offset;
  2. geographic position by interpolation along the segment's lat/lng path;
  3. layer-pixel position via `map.latLngToLayerPoint`;
  4. heading from two nearby path samples (±small delta), with vertical flip
     when heading left;
  5. sets `transform="translate(x,y) rotate(deg)"` (+ `scale(1,-1)` composed in
     for the flip) directly on the `<g>`.
  No `setState` per frame.
- **Pan/zoom:** on map `move`/`zoom`, reposition the SVG container to the new
  pixel origin. Per-frame projection keeps vehicles glued to their lines during
  and after pan/zoom (no stale-projection caching).
- **Lifecycle:** loop starts when `showFlowAnimation` is true and stops when it
  turns false (vehicles removed); rAF pauses automatically in hidden tabs;
  unmount removes the pane, SVG, listeners, and cancels the loop.

### Path sampling

- Reuse `getSegmentRenderCoordinates` for the source coordinates.
- Precompute per animated segment (memoized on `routes`) a cumulative-length
  table over the lat/lng polyline so position-at-distance lookup is
  O(log n) binary search + linear interpolation per frame.
- Train car spacing is defined in screen pixels and converted to path-distance
  at the current zoom each frame (cheap scalar), so the train doesn't stretch
  or squash as the user zooms.
- Heading is computed in projected (pixel) space, not lat/lng space, so
  rotation is visually correct at all latitudes.

## Cleanup

Remove now-dead code:

- `createFlowIcon` and `FLOW_ARROW_DIMENSIONS` in `corridor-map-canvas.tsx`
- `FlowMarkers` component and its 120ms interval
- `.flow-icon-wrapper`, `.flow-icon`, `.flow-icon__shadow`, `.flow-icon__dot`,
  `.flow-icon--{road,rail,ship}` rules and the `flow-arrow-*` keyframes in
  `src/app/globals.css`

## Accessibility

- `prefers-reduced-motion: reduce` disables the vehicle animation entirely
  (checked via `matchMedia` in `VehicleLayer`; corridor lines remain static).
- Vehicle SVG nodes are `aria-hidden` / non-interactive (same as current flow
  markers: `interactive: false`).

## Testing

- **Unit tests** for the path-sampling helpers:
  - cumulative-length table construction;
  - position lookup at t=0, t=1, midpoints, and degenerate (2-point) paths;
  - heading calculation and left-heading flip logic.
- **Manual browser verification:**
  - all three vehicle types render and animate on real corridor data;
  - vehicles stay glued to lines during pan and zoom;
  - `showFlowAnimation` toggle starts/stops cleanly;
  - fade-out/in at segment ends;
  - performance spot-check on the densest corridor view (all corridors
    visible, ~24 animated segments → up to ~96 SVG groups if every segment
    were rail; typically fewer with the ship/road mix).

## Out of scope

- Per-route or per-mode vehicle tinting (decided against — neutral only)
- Changing which/how many segments animate
- Vehicle interactions (tooltips, clicks)
- Rotating the static station/port markers
