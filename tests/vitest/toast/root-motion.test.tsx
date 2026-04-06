// @vitest-environment jsdom
// @ts-nocheck

import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { tweenService, MockTweenInfo } = vi.hoisted(() => {
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

  const createdTweens: Array<{
    instance: Record<string, unknown>;
    goals: Record<string, unknown>;
  }> = [];

  const tweenService = {
    createdTweens,
    Create: vi.fn((instance: Record<string, unknown>, _info: MockTweenInfo, goals: Record<string, unknown>) => {
      createdTweens.push({
        instance,
        goals,
      });

      return {
        Completed: {
          Connect() {
            return { Disconnect() {} };
          },
        },
        Play() {},
        Cancel() {},
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
    EasingStyle: {
      Quad: "Quad",
    },
    EasingDirection: {
      In: "In",
      Out: "Out",
    },
  };
  (globalThis as Record<string, unknown>).TweenInfo = MockTweenInfo as unknown as typeof TweenInfo;
  (globalThis as Record<string, unknown>).typeIs = (value: unknown, typeStr: string) => typeof value === typeStr;
  (globalThis as Record<string, unknown>).pairs = (obj: Record<string, unknown>) => Object.entries(obj);

  return { tweenService, MockTweenInfo };
});

vi.mock("@lattice-ui/core", () => {
  const React = require("react");

  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!React.isValidElement(children)) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
      ...slotProps,
    });
  }

  return {
    React,
    Slot,
  };
});

import type { MotionConfig } from "@lattice-ui/motion";
import { ToastRoot } from "../../../packages/toast/src/Toast/ToastRoot";

function installTweenServiceMock() {
  tweenService.createdTweens.length = 0;
}

beforeEach(() => {
  installTweenServiceMock();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ToastRoot motion regressions", () => {
  it("uses a valid MotionConfig and applies custom transitions to the rendered child", () => {
    const customTransition: MotionConfig = {
      entering: {
        tweenInfo: new MockTweenInfo(0.14, "Quad", "Out") as unknown as TweenInfo,
        initial: {
          BackgroundTransparency: 0.9,
        },
        goals: {
          BackgroundTransparency: 0.25,
        },
      },
      entered: {
        goals: {
          BackgroundTransparency: 0.25,
        },
      },
    };

    const { getByTestId, rerender } = render(
      <ToastRoot asChild={true} transition={customTransition} visible={false}>
        <frame data-testid="toast" />
      </ToastRoot>,
    );

    const toast = getByTestId("toast");
    installTweenServiceMock();

    rerender(
      <ToastRoot asChild={true} transition={customTransition} visible={true}>
        <frame data-testid="toast" />
      </ToastRoot>,
    );

    expect(tweenService.createdTweens).toHaveLength(1);
    expect(tweenService.createdTweens[0]?.instance).toBe(toast);
    expect((toast as Record<string, unknown>).BackgroundTransparency).toBe(0.9);
    expect(tweenService.createdTweens[0]?.goals.BackgroundTransparency).toBe(0.25);
  });
});
