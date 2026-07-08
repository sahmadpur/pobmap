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
