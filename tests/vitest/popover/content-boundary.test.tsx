// @vitest-environment jsdom
// @ts-nocheck

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

let capturedLayerProps: Record<string, unknown> | undefined;

(globalThis as Record<string, unknown>).Enum = {
  AutomaticSize: {
    XY: "XY",
  },
};

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

  function getElementRef(child: React.ReactElement) {
    return child.props.ref ?? child.ref;
  }

  return {
    React,
    composeRefs,
    createStrictContext,
    getElementRef,
    useControllableState,
  };
});

vi.mock("@lattice-ui/focus", () => ({
  FocusScope: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@lattice-ui/layer", () => ({
  DismissableLayer: (props: Record<string, unknown>) => {
    capturedLayerProps = props;
    return React.createElement(React.Fragment, null, props.children);
  },
  Presence: (props: {
    present: boolean;
    render: (state: { isPresent: boolean; onExitComplete: () => void }) => React.ReactElement | null;
  }) => props.render({ isPresent: props.present, onExitComplete: () => undefined }),
}));

vi.mock("@lattice-ui/motion", () => ({
  createCanvasGroupPopperEntranceRecipe: () => ({
    initial: {},
    reveal: { values: {}, intent: {} },
    exit: { values: {}, intent: {} },
  }),
  createPopperEntranceRecipe: () => ({
    initial: {},
    reveal: { values: {}, intent: {} },
    exit: { values: {}, intent: {} },
  }),
  usePresenceMotionController: () => ({
    ref: { current: undefined },
    phase: "visible",
    mounted: true,
  }),
}));

vi.mock("@lattice-ui/popper", () => ({
  usePopper: () => ({
    anchorPoint: new Vector2(0, 0),
    contentSize: new Vector2(0, 0),
    placement: "bottom",
    position: UDim2.fromOffset(24, 36),
    isPositioned: true,
    update: () => undefined,
  }),
}));

import { Popover } from "@lattice-ui/popover";

afterEach(() => {
  cleanup();
  capturedLayerProps = undefined;
  vi.clearAllMocks();
});

(HTMLElement.prototype as Record<string, unknown>).IsA = (className: string) => className === "GuiObject";

describe("popover content boundary wiring", () => {
  it("passes the actual content host to DismissableLayer instead of relying on the full-screen wrapper", () => {
    const { getByTestId } = render(
      <Popover.Root open={true}>
        <Popover.Content asChild>
          <div data-testid="content" />
        </Popover.Content>
      </Popover.Root>,
    );

    const content = getByTestId("content");
    const positionedWrapper = content.parentElement as HTMLElement;

    expect(positionedWrapper.tagName.toLowerCase()).toBe("frame");
    expect(positionedWrapper).not.toBe(content);
    expect((capturedLayerProps?.contentBoundaryRef as { current: unknown }).current).toBe(content);
  });
});
