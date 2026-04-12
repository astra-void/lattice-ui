// @vitest-environment jsdom
// @ts-nocheck

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runService } = vi.hoisted(() => {
  const listeners = new Set<(dt: number) => void>();
  const workspace = {};

  const runService = {
    RenderStepped: {
      Connect(listener: (dt: number) => void) {
        listeners.add(listener);
        return {
          Disconnect() {
            listeners.delete(listener);
          },
        };
      },
    },
    IsStudio() {
      return false;
    },
    step(dt: number) {
      for (const listener of [...listeners]) {
        listener(dt);
      }
    },
    reset() {
      listeners.clear();
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

(HTMLElement.prototype as Record<string, unknown>).IsA = (className: string) => className === "GuiObject";

function setGuiDefaults() {
  const prototype = HTMLElement.prototype as Record<string, unknown>;
  prototype.Position = UDim2.fromOffset(0, 0);
  prototype.GroupTransparency = 0;
}

function clearGuiDefaults() {
  const prototype = HTMLElement.prototype as Record<string, unknown>;
  delete prototype.Position;
  delete prototype.GroupTransparency;
}

vi.mock("@lattice-ui/core", () => {
  const React = require("react");

  function useControllableState<T>(options: { value?: T; defaultValue?: T; onChange?: (value: T) => void }) {
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
    composeRefs,
    createStrictContext,
    useControllableState,
  };
});

vi.mock("@lattice-ui/focus", () => ({
  FocusScope: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@lattice-ui/layer", () => {
  const React = require("react");

  function Presence(props: {
    present: boolean;
    render: (state: { isPresent: boolean; onExitComplete: () => void }) => React.ReactElement | null;
  }) {
    const [mounted, setMounted] = React.useState(props.present);
    const [isPresent, setIsPresent] = React.useState(props.present);

    React.useEffect(() => {
      if (props.present) {
        setMounted(true);
        setIsPresent(true);
        return;
      }

      if (mounted) {
        setIsPresent(false);
      }
    }, [mounted, props.present]);

    if (!mounted) {
      return null;
    }

    return props.render({
      isPresent,
      onExitComplete: () => setMounted(false),
    });
  }

  return {
    DismissableLayer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    Presence,
  };
});

vi.mock("@lattice-ui/popper", () => ({
  usePopper: () => ({
    anchorPoint: new Vector2(0, 0),
    placement: "bottom",
    position: UDim2.fromOffset(24, 36),
    isPositioned: true,
    update: () => undefined,
  }),
}));

import { Popover } from "@lattice-ui/popover";

beforeEach(() => {
  runService.reset();
  setGuiDefaults();
});

afterEach(() => {
  cleanup();
  clearGuiDefaults();
  vi.clearAllMocks();
});

describe("Popover.Content motion host", () => {
  it("keeps positioning on the outer host and animates the inner canvasgroup", () => {
    const { getByTestId } = render(
      <Popover.Root open={true}>
        <Popover.Content asChild>
          <div data-testid="content" />
        </Popover.Content>
      </Popover.Root>,
    );

    const content = getByTestId("content");
    const motionHost = content.parentElement as HTMLElement & Record<string, unknown>;
    const outerHost = motionHost.parentElement as HTMLElement & Record<string, unknown>;

    expect(motionHost.tagName.toLowerCase()).toBe("canvasgroup");
    expect(outerHost.tagName.toLowerCase()).toBe("frame");
    expect(motionHost.Position.Y.Offset).toBe(-10);
    expect(motionHost.GroupTransparency).toBe(1);

    act(() => {
      runService.step(1);
    });

    expect(motionHost.Position.Y.Offset).toBe(0);
    expect(motionHost.GroupTransparency).toBe(0);
  });
});
