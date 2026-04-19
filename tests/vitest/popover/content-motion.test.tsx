// @vitest-environment jsdom
// @ts-nocheck

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPopperResult, resetMockPopperResult, runService, setMockPopperResult } = vi.hoisted(() => {
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

  const mockPopperResult = {
    anchorPoint: new Vector2(0, 0),
    contentSize: new Vector2(0, 0),
    placement: "bottom",
    position: UDim2.fromOffset(24, 36),
    isPositioned: true,
    update: () => undefined,
  };

  const resetMockPopperResult = () => {
    mockPopperResult.anchorPoint = new Vector2(0, 0);
    mockPopperResult.contentSize = new Vector2(0, 0);
    mockPopperResult.placement = "bottom";
    mockPopperResult.position = UDim2.fromOffset(24, 36);
    mockPopperResult.isPositioned = true;
    mockPopperResult.update = () => undefined;
  };

  const setMockPopperResult = (nextValues: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(nextValues)) {
      (mockPopperResult as Record<string, unknown>)[key] = value;
    }
  };

  return { mockPopperResult, resetMockPopperResult, runService, setMockPopperResult };
});

(globalThis as Record<string, unknown>).Enum = {
  AutomaticSize: {
    XY: "XY",
  },
};

let capturedFrameProps: Array<Record<string, unknown>> = [];

(HTMLElement.prototype as Record<string, unknown>).IsA = (className: string) => className === "GuiObject";

function setGuiDefaults() {
  const prototype = HTMLElement.prototype as Record<string, unknown>;
  prototype.AnchorPoint = new Vector2(0, 0);
  prototype.Position = UDim2.fromOffset(0, 0);
  prototype.Size = UDim2.fromOffset(0, 0);
  prototype.GroupTransparency = 0;
}

function clearGuiDefaults() {
  const prototype = HTMLElement.prototype as Record<string, unknown>;
  delete prototype.AnchorPoint;
  delete prototype.Position;
  delete prototype.Size;
  delete prototype.GroupTransparency;
}

vi.mock("@lattice-ui/core", () => {
  const React = require("react");
  const createElement = React.createElement.bind(React);

  const InstrumentedReact = {
    ...React,
    createElement(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) {
      if (type === "frame" && props) {
        capturedFrameProps.push(props);
      }

      return createElement(type, props, ...children);
    },
  };

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

  function getElementRef(child: React.ReactElement) {
    return child.props.ref ?? child.ref;
  }

  return {
    React: InstrumentedReact,
    composeRefs,
    createStrictContext,
    getElementRef,
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
  usePopper: () => mockPopperResult,
}));

import { Popover } from "@lattice-ui/popover";

beforeEach(() => {
  capturedFrameProps = [];
  resetMockPopperResult();
  runService.reset();
  setGuiDefaults();
});

afterEach(() => {
  cleanup();
  clearGuiDefaults();
  vi.clearAllMocks();
});

describe("Popover.Content motion host", () => {
  it("keeps positioning on the outer host and animates asChild content relative to it", () => {
    const { getByTestId } = render(
      <Popover.Root open={true}>
        <Popover.Content asChild>
          <div data-testid="content" />
        </Popover.Content>
      </Popover.Root>,
    );

    const content = getByTestId("content");
    const outerHost = content.parentElement as HTMLElement & Record<string, unknown>;

    expect(outerHost.tagName.toLowerCase()).toBe("frame");
    expect(content.Position.Y.Offset).toBe(10);

    act(() => {
      runService.step(1);
    });

    expect(content.Position.Y.Offset).toBe(0);
  });

  it("keeps bottom placement visually centered by matching wrapper and visible content left edge", () => {
    setMockPopperResult({
      anchorPoint: new Vector2(0.5, 0),
      contentSize: new Vector2(200, 100),
      placement: "bottom",
      position: UDim2.fromOffset(350, 230),
    });

    const { getByTestId } = render(
      <Popover.Root open={true}>
        <Popover.Content asChild>
          <div data-testid="content" />
        </Popover.Content>
      </Popover.Root>,
    );

    const content = getByTestId("content") as HTMLElement & Record<string, unknown>;
    expect(capturedFrameProps.length).toBeGreaterThan(0);
    const wrapperProps = capturedFrameProps[capturedFrameProps.length - 1] as Record<string, unknown>;
    const wrapperSize = wrapperProps.Size as UDim2;
    const wrapperPosition = wrapperProps.Position as UDim2;
    const wrapperAnchorPoint = wrapperProps.AnchorPoint as Vector2;

    expect(wrapperSize.X.Offset).toBe(200);
    expect(wrapperSize.Y.Offset).toBe(100);

    const wrapperLeft = wrapperPosition.X.Offset - wrapperAnchorPoint.X * wrapperSize.X.Offset;
    const visibleContentLeft = wrapperLeft + (content.Position as UDim2).X.Offset;

    expect(wrapperLeft).toBe(250);
    expect(visibleContentLeft).toBe(250);
  });
});
