// @vitest-environment jsdom

// Tooltip.Trigger opens from managed focus (its focus node's onFocusChange),
// not from the engine's SelectionGained/SelectionLost.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type FocusNodeOptions = { onFocusChange?: (focused: boolean) => void };

const focusNodeOptions: FocusNodeOptions[] = [];

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const react = await import("react");

  return {
    composeEvents: runtimeProps.composeEvents,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot: (props: Record<string, unknown>) => {
      slotProps = props;
      return null;
    },
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  useFocusNode: (options: FocusNodeOptions) => {
    focusNodeOptions.push(options);
    return { current: undefined };
  },
}));

let slotProps: Record<string, unknown> = {};

import { TooltipTrigger } from "../../../packages/react/tooltip/src/Tooltip/TooltipTrigger";
import { TooltipContextProvider } from "../../../packages/react/tooltip/src/Tooltip/context";

afterEach(() => {
  cleanup();
  focusNodeOptions.splice(0);
});

describe("Tooltip.Trigger focus", () => {
  it("opens on managed focus and closes when focus leaves", () => {
    const setOpen = vi.fn();
    const close = vi.fn();
    const context = {
      open: false,
      setOpen,
      close,
      openWithDelay: vi.fn(),
      triggerRef: { current: undefined },
    };

    render(
      React.createElement(
        TooltipContextProvider as React.ComponentType<{ value: unknown; children?: React.ReactNode }>,
        { value: context },
        React.createElement(TooltipTrigger, { asChild: true }, React.createElement("textbutton")),
      ),
    );

    const events = slotProps.Event as Record<string, unknown>;
    expect(events.SelectionGained).toBeUndefined();
    expect(events.SelectionLost).toBeUndefined();

    act(() => focusNodeOptions.at(-1)?.onFocusChange?.(true));
    expect(setOpen).toHaveBeenCalledWith(true);

    act(() => focusNodeOptions.at(-1)?.onFocusChange?.(false));
    expect(close).toHaveBeenCalled();
  });
});
