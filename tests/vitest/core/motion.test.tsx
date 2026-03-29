// @vitest-environment jsdom
// @ts-nocheck

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionPolicyProvider } from "../../../packages/core/src/motion/policy";
import {
  applyMotionProperties,
  getMotionTransitionExitFallbackMs,
  mergeMotionTransition,
} from "../../../packages/core/src/motion/transition";
import type { MotionTransition } from "../../../packages/core/src/motion/types";
import { useMotionTween } from "../../../packages/core/src/motion/useMotionTween";

class MockTweenInfo {
  public Time: number;
  public EasingStyle: string;
  public EasingDirection: string;

  constructor(time: number, easingStyle: string, easingDirection: string) {
    this.Time = time;
    this.EasingStyle = easingStyle;
    this.EasingDirection = easingDirection;
  }
}

type TweenRecord = {
  instance: Record<string, unknown>;
  info: MockTweenInfo;
  goals: Record<string, unknown>;
  played: boolean;
  canceled: boolean;
  listeners: Array<(state: unknown) => void>;
  Play: () => void;
  Cancel: () => void;
  fireCompleted: (state?: unknown) => void;
};

function createTweenRecord(
  instance: Record<string, unknown>,
  info: MockTweenInfo,
  goals: Record<string, unknown>,
): TweenRecord {
  const record: TweenRecord = {
    instance,
    info,
    goals,
    played: false,
    canceled: false,
    listeners: [],
    Play() {
      record.played = true;
    },
    Cancel() {
      record.canceled = true;
    },
    fireCompleted(state = "Completed") {
      for (const listener of record.listeners) {
        listener(state);
      }
    },
  };

  return record;
}

const createdTweens: Array<TweenRecord> = [];

function installTweenServiceMock() {
  createdTweens.length = 0;
  const tweenService = {
    Create: vi.fn((instance: Record<string, unknown>, info: MockTweenInfo, goals: Record<string, unknown>) => {
      const record = createTweenRecord(instance, info, goals);
      createdTweens.push(record);
      return {
        Completed: {
          Connect(listener: (state: unknown) => void) {
            record.listeners.push(listener);
            return {
              Disconnect() {
                record.listeners = record.listeners.filter((entry) => entry !== listener);
              },
            };
          },
        },
        Play: record.Play,
        Cancel: record.Cancel,
      } as unknown as Tween;
    }),
  };

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn(() => tweenService),
  } as unknown as DataModel;
  (globalThis as Record<string, unknown>).Enum = {
    PlaybackState: {
      Completed: "Completed",
    },
  };
  (globalThis as Record<string, unknown>).TweenInfo = MockTweenInfo as unknown as typeof TweenInfo;

  return tweenService;
}

function MotionHarness(props: {
  active: boolean;
  transition: MotionTransition;
  instance: Record<string, unknown>;
  onExitComplete?: () => void;
}) {
  const ref = React.useRef(props.instance as unknown as Instance);
  useMotionTween(ref, {
    active: props.active,
    onExitComplete: props.onExitComplete,
    transition: props.transition,
  });

  return null;
}

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  installTweenServiceMock();
});

describe("core motion helpers", () => {
  it("merges motion transitions and preserves exit duration", () => {
    const base: MotionTransition = {
      enter: {
        tweenInfo: new MockTweenInfo(0.12, "Quad", "Out") as unknown as TweenInfo,
        from: { Position: UDim2.fromOffset(0, 6) },
        to: { Position: UDim2.fromOffset(0, 0) },
      },
      exit: {
        tweenInfo: new MockTweenInfo(0.1, "Quad", "In") as unknown as TweenInfo,
        to: { Position: UDim2.fromOffset(0, 6) },
      },
    };

    const merged = mergeMotionTransition(base, {
      enter: {
        to: { Position: UDim2.fromOffset(0, 2) },
      },
    });

    expect(merged).not.toBe(false);
    if (!merged || merged === false) {
      throw new Error("expected merged transition");
    }

    const mergedTransition: MotionTransition = merged;
    expect(mergedTransition.enter?.from).toEqual({ Position: UDim2.fromOffset(0, 6) });
    expect(mergedTransition.enter?.to).toEqual({ Position: UDim2.fromOffset(0, 2) });
    expect(getMotionTransitionExitFallbackMs(mergedTransition)).toBe(100);
  });

  it("applies motion properties directly", () => {
    const instance = { Position: UDim2.fromOffset(0, 0), BackgroundTransparency: 1 };
    applyMotionProperties(instance as unknown as Instance, {
      Position: UDim2.fromOffset(8, 4),
      BackgroundTransparency: 0.25,
    });

    expect(instance.Position).toEqual(UDim2.fromOffset(8, 4));
    expect(instance.BackgroundTransparency).toBe(0.25);
  });

  it("reuses the current live value when a tween is interrupted in the opposite direction", async () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
    };

    const transition: MotionTransition = {
      enter: {
        tweenInfo: new MockTweenInfo(0.12, "Quad", "Out") as unknown as TweenInfo,
        from: { Position: UDim2.fromOffset(0, 12) },
        to: { Position: UDim2.fromOffset(0, 0) },
      },
      exit: {
        tweenInfo: new MockTweenInfo(0.1, "Quad", "In") as unknown as TweenInfo,
        to: { Position: UDim2.fromOffset(0, 12) },
      },
    };

    const { rerender } = render(
      React.createElement(
        MotionPolicyProvider,
        { disableAllMotion: false },
        React.createElement(MotionHarness, { active: true, instance, transition }),
      ),
    );

    expect(instance.Position).toEqual(UDim2.fromOffset(0, 12));
    expect(createdTweens).toHaveLength(1);
    expect(createdTweens[0]?.goals.Position).toEqual(UDim2.fromOffset(0, 0));

    instance.Position = UDim2.fromOffset(0, 5);

    rerender(
      React.createElement(
        MotionPolicyProvider,
        { disableAllMotion: false },
        React.createElement(MotionHarness, { active: false, instance, transition }),
      ),
    );

    expect(instance.Position).toEqual(UDim2.fromOffset(0, 5));
    expect(createdTweens).toHaveLength(2);
    expect(createdTweens[1]?.goals.Position).toEqual(UDim2.fromOffset(0, 12));
  });

  it("short-circuits tween creation when motion is disabled", () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
    };

    render(
      React.createElement(
        MotionPolicyProvider,
        { disableAllMotion: true },
        React.createElement(MotionHarness, {
          active: true,
          instance,
          transition: {
            enter: {
              tweenInfo: new MockTweenInfo(0.12, "Quad", "Out") as unknown as TweenInfo,
              from: { Position: UDim2.fromOffset(0, 12) },
              to: { Position: UDim2.fromOffset(0, 0) },
            },
            exit: {
              tweenInfo: new MockTweenInfo(0.1, "Quad", "In") as unknown as TweenInfo,
              to: { Position: UDim2.fromOffset(0, 12) },
            },
          },
        }),
      ),
    );

    expect(createdTweens).toHaveLength(0);
    expect(instance.Position).toEqual(UDim2.fromOffset(0, 0));
  });
});
