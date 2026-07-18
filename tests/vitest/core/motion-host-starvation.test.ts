// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../packages/motion/src/runtime/scheduler", () => ({
  scheduleHost: () => {},
  unscheduleHost: () => {},
}));

import { MotionHost } from "../../../packages/motion/src/runtime/host";

function makeGuiStub() {
  return {
    ClassName: "Frame",
    BackgroundTransparency: 0,
  };
}

describe("MotionHost write starvation", () => {
  it("keeps writing the fade when every per-frame delta is sub-threshold", async () => {
    // A 10s transparency fade sampled at 240Hz advances by ~0.0004 per frame,
    // below the driver's 0.0005 precision. When `applied` is advanced on a
    // skipped write, it creeps toward the target frame after frame while the
    // instance is never touched: the fade renders as a stuck-then-snap instead
    // of a smooth progression. `applied` must instead track the last value
    // actually written, so the accumulated delta eventually crosses precision
    // and lands on the instance.
    const instance = makeGuiStub();
    const host = new MotionHost(instance);

    const onComplete = vi.fn();
    const duration = 10;
    host.runTimed(
      "presence",
      "reveal",
      { BackgroundTransparency: 1 },
      { duration, curve: "linear", precision: 0.0005 },
      onComplete,
    );

    const dt = 1 / 240; // 240Hz => per-frame alpha delta ~0.000417 < precision
    const totalFrames = Math.ceil(duration / dt);
    const midpoint = Math.floor(totalFrames / 2);

    let frame = 0;
    let midpointValue = 0;
    let active = true;
    while (active && frame < totalFrames * 2) {
      active = host.step(dt);
      frame += 1;
      if (frame === midpoint) {
        midpointValue = instance.BackgroundTransparency;
      }
      expect(instance.BackgroundTransparency).toBeLessThanOrEqual(1);
    }

    // Halfway through, a linear fade should have written roughly the midpoint
    // value to the instance — not left it pinned at the origin.
    expect(midpointValue).toBeGreaterThan(0.1);
    expect(midpointValue).toBeLessThan(0.9);

    // The fade converges on — and actually writes — the target.
    expect(instance.BackgroundTransparency).toBe(1);

    // Completion is deferred through task.defer; give it a tick to land.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onComplete).toHaveBeenCalled();
  });
});
