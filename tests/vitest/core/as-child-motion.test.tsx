// @vitest-environment jsdom
// @ts-nocheck

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runService } = vi.hoisted(() => {
  const renderSteppedListeners = new Set<(dt: number) => void>();
  const workspace = {};

  const runService = {
    RenderStepped: {
      Connect(listener: (dt: number) => void) {
        renderSteppedListeners.add(listener);
        return {
          Disconnect() {
            renderSteppedListeners.delete(listener);
          },
        };
      },
    },
    IsStudio() {
      return false;
    },
    step(dt: number) {
      for (const listener of [...renderSteppedListeners]) {
        listener(dt);
      }
    },
    reset() {
      renderSteppedListeners.clear();
    },
  };

  (globalThis as Record<string, unknown>).game = {
    GetService: vi.fn((serviceName: string) => {
      if (serviceName === "RunService") {
        return runService;
      }
      if (serviceName === "Workspace") {
        return workspace;
      }
      return {};
    }),
  } as unknown as DataModel;

  return { runService };
});

(globalThis as Record<string, unknown>).Enum = {
  AutomaticSize: {
    XY: "XY",
  },
};

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

  function composeRefs(...refs: Array<React.Ref<unknown> | undefined>) {
    return (node: unknown) => {
      for (const ref of refs) {
        if (!ref) {
          continue;
        }

        if (typeof ref === "function") {
          ref(node);
          continue;
        }

        if ("current" in ref) {
          ref.current = node;
        }
      }
    };
  }

  return {
    React,
    Slot,
    composeRefs,
    createStrictContext,
    useControllableState,
  };
});

import { Progress } from "@lattice-ui/progress";
import { Switch } from "@lattice-ui/switch";

function setGuiDefaults() {
  const prototype = HTMLElement.prototype as Record<string, unknown>;
  prototype.Position = UDim2.fromOffset(0, 0);
  prototype.Size = UDim2.fromScale(0, 0);
}

function clearGuiDefaults() {
  const prototype = HTMLElement.prototype as Record<string, unknown>;
  delete prototype.Position;
  delete prototype.Size;
}

beforeEach(() => {
  runService.reset();
  setGuiDefaults();
});

afterEach(() => {
  cleanup();
  clearGuiDefaults();
  vi.clearAllMocks();
});

describe("asChild motion ownership", () => {
  it("animates a custom switch thumb wrapper instead of leaving it pinned to the child", () => {
    const { getByTestId, rerender } = render(
      <Switch.Root checked={false}>
        <Switch.Thumb asChild>
          <div data-testid="thumb" />
        </Switch.Thumb>
      </Switch.Root>,
    );

    act(() => {
      runService.step(1);
    });

    const thumbHost = getByTestId("thumb").parentElement as HTMLElement & { Position: UDim2 };
    expect(thumbHost.tagName.toLowerCase()).toBe("frame");
    expect(thumbHost.Position.X.Offset).toBe(2);
    expect(thumbHost.Position.Y.Offset).toBe(2);

    rerender(
      <Switch.Root checked={true}>
        <Switch.Thumb asChild>
          <div data-testid="thumb" />
        </Switch.Thumb>
      </Switch.Root>,
    );

    act(() => {
      runService.step(0.04);
    });

    expect(thumbHost.Position.X.Scale).toBeGreaterThan(0);
    expect(thumbHost.Position.X.Scale).toBeLessThan(1);

    act(() => {
      runService.step(1);
    });

    expect(thumbHost.Position.X.Scale).toBe(1);
    expect(thumbHost.Position.X.Offset).toBe(-18);
    expect(thumbHost.Position.Y.Offset).toBe(2);
  });

  it("keeps progress width motion on the wrapper while the custom child fills it", () => {
    const { getByTestId, rerender } = render(
      <Progress.Root max={100} value={25}>
        <Progress.Indicator asChild>
          <div data-testid="indicator" />
        </Progress.Indicator>
      </Progress.Root>,
    );

    const indicator = getByTestId("indicator");
    const indicatorHost = indicator.parentElement as HTMLElement & { Size: UDim2 };

    expect(indicatorHost.tagName.toLowerCase()).toBe("frame");

    act(() => {
      runService.step(1);
    });

    expect(indicatorHost.Size.X.Scale).toBe(0.25);

    rerender(
      <Progress.Root max={100} value={75}>
        <Progress.Indicator asChild>
          <div data-testid="indicator" />
        </Progress.Indicator>
      </Progress.Root>,
    );

    act(() => {
      runService.step(0.02);
    });

    expect(indicatorHost.Size.X.Scale).toBeGreaterThan(0.25);
    expect(indicatorHost.Size.X.Scale).toBeLessThan(0.75);

    act(() => {
      runService.step(1);
    });

    expect(indicatorHost.Size.X.Scale).toBe(0.75);
  });
});
