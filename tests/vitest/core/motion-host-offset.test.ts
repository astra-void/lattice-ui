// @ts-nocheck
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../packages/react/motion/src/runtime/scheduler", () => ({
  scheduleHost: () => {},
  unscheduleHost: () => {},
}));

import { motionTargets } from "../../../packages/react/motion/src/core/types";
import { MotionHost } from "../../../packages/react/motion/src/runtime/host";

function makeGuiStub(position: UDim2) {
  return {
    ClassName: "Frame",
    Position: position,
    BackgroundTransparency: 0,
  };
}

function expectUDim2(value: UDim2, xScale: number, xOffset: number, yScale: number, yOffset: number) {
  expect(value.X.Scale).toBe(xScale);
  expect(value.X.Offset).toBe(xOffset);
  expect(value.Y.Scale).toBe(yScale);
  expect(value.Y.Offset).toBe(yOffset);
}

describe("MotionHost offset-wrapper Position resolution", () => {
  it("treats Position values as offsets from the authored position", async () => {
    const target = motionTargets.offsetWrapper("test");
    const instance = makeGuiStub(new UDim2(0, 0, 0, 82));
    const host = new MotionHost(instance, target);

    // Surface-reveal style initial snapshot: slide 4px down from the base.
    host.sync({ Position: new UDim2(0, 0, 0, 4) }, "presence", "initial");
    expectUDim2(instance.Position, 0, 0, 0, 86);

    // Reveal back to the base position, not to absolute (0, 0).
    const onComplete = vi.fn();
    host.runTimed(
      "presence",
      "reveal",
      { Position: new UDim2(0, 0, 0, 0) },
      { duration: 0.1, curve: "linear", precision: 0.0005 },
      onComplete,
    );
    host.step(0.2);
    expectUDim2(instance.Position, 0, 0, 0, 82);
    // Completion is deferred through task.defer; give it a tick to land.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onComplete).toHaveBeenCalled();
  });

  it("keeps the base captured before the first motion write", () => {
    const target = motionTargets.offsetWrapper("test");
    const instance = makeGuiStub(new UDim2(0.5, 10, 0, 20));
    const host = new MotionHost(instance, target);

    host.sync({ Position: new UDim2(0, 0, 0, -4) }, "presence", "initial");
    expectUDim2(instance.Position, 0.5, 10, 0, 16);

    // A later exit uses the same base, not the moved position.
    host.sync({ Position: new UDim2(0, 0, 0, 4) }, "presence", "exit");
    expectUDim2(instance.Position, 0.5, 10, 0, 24);
  });

  it("resolves unchanged for dedicated wrappers at (0, 0)", () => {
    const target = motionTargets.offsetWrapper("switch thumb response");
    const instance = makeGuiStub(new UDim2(0, 0, 0, 0));
    const host = new MotionHost(instance, target);

    // Absolute-style values (the switch thumb contract) pass through as-is.
    host.sync({ Position: new UDim2(1, -24, 0, 2) }, "response", "settle");
    expectUDim2(instance.Position, 1, -24, 0, 2);
  });

  it("leaves layout-role Position values absolute", () => {
    const target = motionTargets.layout("test");
    const instance = makeGuiStub(new UDim2(0, 0, 0, 82));
    const host = new MotionHost(instance, target);

    host.sync({ Position: new UDim2(0, 0, 0, 4) }, "presence", "initial");
    expectUDim2(instance.Position, 0, 0, 0, 4);
  });

  it("does not touch non-Position properties", () => {
    const target = motionTargets.offsetWrapper("test");
    const instance = makeGuiStub(new UDim2(0, 0, 0, 82));
    const host = new MotionHost(instance, target);

    host.sync({ BackgroundTransparency: 1 }, "presence", "initial");
    expect(instance.BackgroundTransparency).toBe(1);
    expectUDim2(instance.Position, 0, 0, 0, 82);
  });
});
