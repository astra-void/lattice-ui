// @vitest-environment jsdom
// @ts-nocheck

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/core", () => ({
  React: require("react"),
}));

import type { MotionConfig, MotionPhase } from "@lattice-ui/motion";
import { applyMotionProperties, MotionPolicyProvider, useStateMotion } from "@lattice-ui/motion";

class MockTweenInfo {
  public Time: number;
  public EasingStyle: string;
  public EasingDirection: string;
  public RepeatCount: number;
  public Reverses: boolean;
  public DelayTime: number;

  constructor(
    time: number,
    easingStyle: string,
    easingDirection: string,
    repeatCount = 0,
    reverses = false,
    delayTime = 0,
  ) {
    this.Time = time;
    this.EasingStyle = easingStyle;
    this.EasingDirection = easingDirection;
    this.RepeatCount = repeatCount;
    this.Reverses = reverses;
    this.DelayTime = delayTime;
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
  (globalThis as Record<string, unknown>).typeIs = (value: unknown, typeStr: string) => typeof value === typeStr;
  (globalThis as Record<string, unknown>).pairs = (obj: Record<string, unknown>) => Object.entries(obj);

  return tweenService;
}

function MotionHarness(props: {
  present: boolean;
  config: MotionConfig;
  instance: Record<string, unknown>;
  appear?: boolean;
}) {
  const ref = useStateMotion(props.present, props.config, props.appear);
  React.useEffect(() => {
    ref.current = props.instance as unknown as Instance;
  }, [props.instance, ref]);

  return null;
}

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  installTweenServiceMock();
});

describe("core motion helpers", () => {
  it("applies motion properties directly", () => {
    const instance = { Position: UDim2.fromOffset(0, 0), BackgroundTransparency: 1 };
    applyMotionProperties(instance as unknown as Instance, {
      Position: UDim2.fromOffset(8, 4),
      BackgroundTransparency: 0.25,
    });

    expect(instance.Position).toEqual(UDim2.fromOffset(8, 4));
    expect(instance.BackgroundTransparency).toBe(0.25);
  });

  it("transitions between phases and sets goals", () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
    };

    const config: MotionConfig = {
      entering: {
        tweenInfo: new MockTweenInfo(0.12, "Quad", "Out") as unknown as TweenInfo,
        initial: { Position: UDim2.fromOffset(0, 12) },
        goals: { Position: UDim2.fromOffset(0, 0) },
      },
      exiting: {
        tweenInfo: new MockTweenInfo(0.1, "Quad", "In") as unknown as TweenInfo,
        goals: { Position: UDim2.fromOffset(0, 12) },
      },
    };

    const { rerender } = render(
      React.createElement(
        MotionPolicyProvider,
        { disableAllMotion: false },
        React.createElement(MotionHarness, { present: true, instance, config, appear: true }),
      ),
    );

    // Initial properties are applied immediately when entering
    expect(instance.Position).toEqual(UDim2.fromOffset(0, 12));
    expect(createdTweens).toHaveLength(1);
    expect(createdTweens[0]?.goals.Position).toEqual(UDim2.fromOffset(0, 0));

    rerender(
      React.createElement(
        MotionPolicyProvider,
        { disableAllMotion: false },
        React.createElement(MotionHarness, { present: false, instance, config, appear: true }),
      ),
    );

    expect(createdTweens).toHaveLength(2);
    expect(createdTweens[1]?.goals.Position).toEqual(UDim2.fromOffset(0, 12));
  });

  it("short-circuits tween creation when motion is disabled and applies goals immediately", () => {
    const instance = {
      Position: UDim2.fromOffset(0, 0),
    };

    render(
      React.createElement(
        MotionPolicyProvider,
        { disableAllMotion: true },
        React.createElement(MotionHarness, {
          present: true,
          instance,
          appear: true,
          config: {
            entering: {
              tweenInfo: new MockTweenInfo(0.12, "Quad", "Out") as unknown as TweenInfo,
              initial: { Position: UDim2.fromOffset(0, 12) },
              goals: { Position: UDim2.fromOffset(0, 0) },
            },
          },
        }),
      ),
    );

    expect(createdTweens).toHaveLength(0);
    // Goals are applied directly instead of animating
    expect(instance.Position).toEqual(UDim2.fromOffset(0, 0));
  });
});
