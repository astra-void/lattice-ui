// @vitest-environment jsdom

// Dialog.Trigger / Popover.Trigger must be activatable from keyboard and
// gamepad: the focus node carries `onActivate` (the engine never fires
// `Activated` for them on its own), and a paired activation opens only once.

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
    focusGuiObject: () => undefined,
    useActivationGuard: guard.useActivationGuard,
    useFocusNode: (options: FocusNodeOptions) => {
      focusNodeOptions.push(options);
      return { current: undefined };
    },
  };
});

import { DialogTrigger } from "../../../packages/react/dialog/src/Dialog/DialogTrigger";
import { DialogContextProvider } from "../../../packages/react/dialog/src/Dialog/context";
import { PopoverTrigger } from "../../../packages/react/popover/src/Popover/PopoverTrigger";
import { PopoverContextProvider } from "../../../packages/react/popover/src/Popover/context";

afterEach(() => {
  cleanup();
  focusNodeOptions.splice(0);
});

function flushDefer() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const variants = [
  { name: "Dialog.Trigger", Trigger: DialogTrigger, Provider: DialogContextProvider },
  { name: "Popover.Trigger", Trigger: PopoverTrigger, Provider: PopoverContextProvider },
] as const;

describe.each(variants)("$name", ({ Trigger, Provider }) => {
  function renderTrigger(setOpen: (open: boolean) => void) {
    let triggerProps: Record<string, unknown> = {};

    const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
      triggerProps = props;
      return null;
    });
    Probe.displayName = "Probe";

    render(
      React.createElement(
        Provider as React.ComponentType<{ value: unknown; children?: React.ReactNode }>,
        { value: { open: false, setOpen, triggerRef: { current: undefined }, anchorRef: { current: undefined } } },
        React.createElement(Trigger as React.ComponentType<Record<string, unknown>>, { asChild: true }, React.createElement(Probe)),
      ),
    );

    return { getProps: () => triggerProps };
  }

  it("registers a selectable focus node", () => {
    const { getProps } = renderTrigger(() => {});

    expect(focusNodeOptions.length).toBeGreaterThan(0);
    expect(getProps().Selectable).toBe(true);
  });

  it("opens once when the focus node activates", async () => {
    const setOpen = vi.fn();
    const { getProps } = renderTrigger(setOpen);

    act(() => {
      focusNodeOptions[focusNodeOptions.length - 1].onActivate?.();
      (getProps().Event as { Activated: () => void }).Activated();
    });

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);

    await act(async () => {
      await flushDefer();
    });
  });
});
