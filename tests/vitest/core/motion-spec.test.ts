// @ts-nocheck
import { describe, expect, it } from "vitest";

import {
  applyMotionCurve,
  resolveFeedbackDriver,
  resolvePresenceDriver,
  resolveResponseDriver,
} from "../../../packages/react/motion/src/runtime/spec";

describe("applyMotionCurve", () => {
  it("treats linear as identity", () => {
    expect(applyMotionCurve("linear", 0)).toBe(0);
    expect(applyMotionCurve("linear", 0.25)).toBe(0.25);
    expect(applyMotionCurve("linear", 1)).toBe(1);
  });

  it("squares alpha for accelerate", () => {
    expect(applyMotionCurve("accelerate", 0)).toBe(0);
    expect(applyMotionCurve("accelerate", 1)).toBe(1);
    expect(applyMotionCurve("accelerate", 0.5)).toBeCloseTo(0.25, 10);
  });

  it("eases out for decelerate", () => {
    expect(applyMotionCurve("decelerate", 0)).toBe(0);
    expect(applyMotionCurve("decelerate", 1)).toBe(1);
    expect(applyMotionCurve("decelerate", 0.5)).toBeCloseTo(0.75, 10);
  });

  it("keeps standard continuous and monotonic", () => {
    expect(applyMotionCurve("standard", 0)).toBe(0);
    expect(applyMotionCurve("standard", 1)).toBe(1);
    // The piecewise boundary at 0.5 must resolve to exactly 0.5.
    expect(applyMotionCurve("standard", 0.5)).toBeCloseTo(0.5, 10);

    const samples = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
    for (let index = 1; index < samples.length; index++) {
      const previous = applyMotionCurve("standard", samples[index - 1]);
      const current = applyMotionCurve("standard", samples[index]);
      expect(current).toBeGreaterThan(previous);
    }
  });
});

describe("resolvePresenceDriver", () => {
  it("uses documented steady durations by default", () => {
    expect(resolvePresenceDriver("reveal").duration).toBeCloseTo(0.14, 10);
    expect(resolvePresenceDriver("exit").duration).toBeCloseTo(0.11, 10);
  });

  it("maps tempo presets per step", () => {
    expect(resolvePresenceDriver("reveal", { tempo: "swift" }).duration).toBeCloseTo(0.1, 10);
    expect(resolvePresenceDriver("reveal", { tempo: "gentle" }).duration).toBeCloseTo(0.2, 10);
    expect(resolvePresenceDriver("exit", { tempo: "swift" }).duration).toBeCloseTo(0.08, 10);
    expect(resolvePresenceDriver("exit", { tempo: "gentle" }).duration).toBeCloseTo(0.14, 10);
  });

  it("collapses instant tempo to a linear zero driver", () => {
    expect(resolvePresenceDriver("reveal", { tempo: "instant" })).toEqual({
      duration: 0,
      curve: "linear",
      precision: 0.0005,
    });
  });

  it("lets an explicit duration override tempo and clamps negatives to zero", () => {
    expect(resolvePresenceDriver("reveal", { tempo: "gentle", duration: 0.5 }).duration).toBeCloseTo(0.5, 10);
    expect(resolvePresenceDriver("reveal", { duration: -1 })).toEqual({
      duration: 0,
      curve: "linear",
      precision: 0.0005,
    });
  });

  it("selects the curve from step and tone", () => {
    expect(resolvePresenceDriver("exit", { tempo: "steady" }).curve).toBe("accelerate");
    expect(resolvePresenceDriver("reveal", { tempo: "steady", tone: "expressive" }).curve).toBe("standard");
    expect(resolvePresenceDriver("reveal", { tempo: "steady" }).curve).toBe("decelerate");
  });
});

describe("resolveResponseDriver", () => {
  it("collapses non-positive durations", () => {
    expect(resolveResponseDriver({ duration: 0 })).toEqual({
      halfLife: 0,
      settleAfter: 0,
      precision: 0.0005,
    });
    expect(resolveResponseDriver({ duration: -0.2 })).toEqual({
      halfLife: 0,
      settleAfter: 0,
      precision: 0.0005,
    });
  });

  it("derives halfLife and settleAfter from duration and tone", () => {
    const responsive = resolveResponseDriver({ duration: 0.2, tone: "responsive" });
    expect(responsive.halfLife).toBeCloseTo(0.2 * 0.35, 10);
    expect(responsive.settleAfter).toBeCloseTo(0.2 * 2.5, 10);

    const expressive = resolveResponseDriver({ duration: 0.2, tone: "expressive" });
    expect(expressive.halfLife).toBeCloseTo(0.2 * 0.28, 10);

    const calm = resolveResponseDriver({ duration: 0.2, tone: "calm" });
    expect(calm.halfLife).toBeCloseTo(0.2 * 0.45, 10);
  });
});

describe("resolveFeedbackDriver", () => {
  it("collapses non-positive durations to a linear zero driver", () => {
    expect(resolveFeedbackDriver("accent", { duration: 0 })).toEqual({
      duration: 0,
      curve: "linear",
      precision: 0.0005,
    });
  });

  it("selects the curve from step and tone", () => {
    expect(resolveFeedbackDriver("accent", { tempo: "steady", tone: "expressive" }).curve).toBe("standard");
    expect(resolveFeedbackDriver("accent", { tempo: "steady", tone: "calm" }).curve).toBe("decelerate");
    expect(resolveFeedbackDriver("recover", { tempo: "steady" }).curve).toBe("accelerate");
  });

  it("uses documented default durations", () => {
    expect(resolveFeedbackDriver("accent").duration).toBeCloseTo(0.1, 10);
    expect(resolveFeedbackDriver("recover").duration).toBeCloseTo(0.14, 10);
  });
});
