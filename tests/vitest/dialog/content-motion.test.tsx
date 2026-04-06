// @vitest-environment jsdom
// @ts-nocheck

import { act, cleanup, render } from "@testing-library/react";
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

  type TweenRecord = {
    instance: Record<string, unknown>;
    goals: Record<string, unknown>;
    listeners: Array<(state: unknown) => void>;
    fireCompleted: (state?: unknown) => void;
  };

  const createdTweens: Array<TweenRecord> = [];

  const tweenService = {
    createdTweens,
    Create: vi.fn((instance: Record<string, unknown>, _info: MockTweenInfo, goals: Record<string, unknown>) => {
      const record: TweenRecord = {
        instance,
        goals,
        listeners: [],
        fireCompleted(state = "Completed") {
          for (const listener of record.listeners) {
            listener(state);
          }
        },
      };

      createdTweens.push(record);

      return {
        Completed: {
          Connect(listener: (state: unknown) => void) {
            record.listeners.push(listener);
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
    TextXAlignment: {
      Left: "Left",
    },
    ZIndexBehavior: {
      Sibling: "Sibling",
    },
  };
  (globalThis as Record<string, unknown>).TweenInfo = MockTweenInfo as unknown as typeof TweenInfo;
  (globalThis as Record<string, unknown>).typeIs = (value: unknown, typeStr: string) => typeof value === typeStr;
  (globalThis as Record<string, unknown>).pairs = (obj: Record<string, unknown>) => Object.entries(obj);

  return { tweenService, MockTweenInfo };
});

vi.mock("@lattice-ui/core", () => {
  const React = require("react");

  function Slot(props: { children?: React.ReactNode; ref?: React.Ref<unknown> } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!React.isValidElement(children)) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
      ...slotProps,
    });
  }

  function useControllableState<T>(options: {
    value?: T;
    defaultValue?: T;
    onChange?: (value: T) => void;
  }) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(options.defaultValue);
    const value = options.value !== undefined ? options.value : uncontrolledValue;

    const setValue = React.useCallback(
      (nextValue: T) => {
        if (options.value === undefined) {
          setUncontrolledValue(nextValue);
        }

        options.onChange?.(nextValue);
      },
      [options.onChange, options.value],
    );

    return [value, setValue] as const;
  }

  function createStrictContext<T>(_name: string) {
    const Context = React.createContext<T | undefined>(undefined);
    const Provider = Context.Provider;
    const useContext = () => {
      const value = React.useContext(Context);
      if (value === undefined) {
        throw new Error("Missing context");
      }

      return value;
    };

    return [Provider, useContext] as const;
  }

  return {
    React,
    Slot,
    useControllableState,
    createStrictContext,
  };
});

vi.mock("@lattice-ui/focus", () => ({
  FocusScope: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@lattice-ui/layer", () => ({
  DismissableLayer: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

import type { MotionConfig } from "@lattice-ui/motion";
import { Dialog } from "@lattice-ui/dialog";

function installTweenServiceMock() {
  tweenService.createdTweens.length = 0;
}

beforeEach(() => {
  installTweenServiceMock();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Dialog.Content motion regressions", () => {
  it("honors transition overrides on the dialog-owned motion host and waits for exit completion before unmounting", () => {
    const customTransition: MotionConfig = {
      exiting: {
        tweenInfo: new MockTweenInfo(0.2, "Quad", "In") as unknown as TweenInfo,
        goals: {
          BackgroundTransparency: 0.85,
        },
      },
    };

    const { getByTestId, queryByTestId, rerender } = render(
      <Dialog.Root open={true}>
        <Dialog.Content transition={customTransition}>
          <frame data-testid="content" />
        </Dialog.Content>
      </Dialog.Root>,
    );

    const content = getByTestId("content");
    const motionHost = content.parentElement;
    expect(motionHost?.tagName.toLowerCase()).toBe("canvasgroup");
    expect(tweenService.createdTweens[0]?.instance).toBe(motionHost);

    rerender(
      <Dialog.Root open={false}>
        <Dialog.Content transition={customTransition}>
          <frame data-testid="content" />
        </Dialog.Content>
      </Dialog.Root>,
    );

    expect(queryByTestId("content")).not.toBeNull();
    expect(tweenService.createdTweens[1]?.instance).toBe(motionHost);
    expect(tweenService.createdTweens[1]?.goals.BackgroundTransparency).toBe(0.85);

    act(() => {
      tweenService.createdTweens[1]?.fireCompleted();
    });

    expect(queryByTestId("content")).toBeNull();
  });

  it("preserves forceMount when closed", () => {
    const { getByTestId } = render(
      <Dialog.Root open={false}>
        <Dialog.Content forceMount={true}>
          <frame data-testid="content" />
        </Dialog.Content>
      </Dialog.Root>,
    );

    expect(getByTestId("content")).not.toBeNull();
  });
});
