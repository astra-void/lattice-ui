// @vitest-environment jsdom

// Dialog.Close / Popover.Close must be reachable and activatable through the
// focus navigation controller: they register a focus node, stay `Selectable`,
// and close exactly once when keyboard/gamepad and pointer activation pair up.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type FocusNodeOptions = {
  ref: { current: unknown };
  onActivate?: () => void;
};

const focusNodeOptions: FocusNodeOptions[] = [];

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const react = await import("react");
  const strictContext = await import("../../../packages/react/runtime/src/context");

  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!react.default.isValidElement(children)) {
      return null;
    }
    return react.default.cloneElement(children, {
      ...(children.props as Record<string, unknown>),
      ...slotProps,
    });
  }

  return {
    composeEvents: runtimeProps.composeEvents,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    React: react.default,
    Slot,
    createStrictContext: strictContext.createStrictContext,
  };
});

vi.mock("@lattice-ui/react-focus", async () => {
  const guard = await import("../../../packages/react/focus/src/useActivationGuard");
  return {
    useActivationGuard: guard.useActivationGuard,
    useFocusNode: (options: FocusNodeOptions) => {
      focusNodeOptions.push(options);
      return { current: undefined };
    },
  };
});

import { DialogClose } from "../../../packages/react/dialog/src/Dialog/DialogClose";
import { DialogContextProvider } from "../../../packages/react/dialog/src/Dialog/context";
import { PopoverClose } from "../../../packages/react/popover/src/Popover/PopoverClose";
import { PopoverContextProvider } from "../../../packages/react/popover/src/Popover/context";

afterEach(() => {
  cleanup();
  focusNodeOptions.splice(0);
});

function flushDefer() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const variants = [
  { name: "Dialog.Close", Close: DialogClose, Provider: DialogContextProvider },
  { name: "Popover.Close", Close: PopoverClose, Provider: PopoverContextProvider },
] as const;

describe.each(variants)("$name", ({ Close, Provider }) => {
  function renderClose(setOpen: (open: boolean) => void) {
    let closeProps: Record<string, unknown> = {};

    const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
      closeProps = props;
      return null;
    });
    Probe.displayName = "Probe";

    render(
      React.createElement(
        Provider as React.ComponentType<{ value: unknown; children?: React.ReactNode }>,
        { value: { open: true, setOpen } },
        React.createElement(Close as React.ComponentType<Record<string, unknown>>, { asChild: true }, React.createElement(Probe)),
      ),
    );

    return { getProps: () => closeProps };
  }

  it("registers a selectable focus node", () => {
    const { getProps } = renderClose(() => {});

    expect(focusNodeOptions.length).toBeGreaterThan(0);
    expect(getProps().Selectable).toBe(true);
  });

  it("closes once when the focus node activates", async () => {
    const setOpen = vi.fn();
    const { getProps } = renderClose(setOpen);

    act(() => {
      focusNodeOptions[focusNodeOptions.length - 1].onActivate?.();
      (getProps().Event as { Activated: () => void }).Activated();
    });

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);

    await act(async () => {
      await flushDefer();
    });
  });
});
