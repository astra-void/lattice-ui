// @vitest-environment jsdom

// MenuItem drives its keyboard behaviour from the focus manager: the highlight
// follows managed focus (not `SelectionGained`/`SelectionLost`) and Enter/Space
// arrive through the focus node's `onActivate` (not an `InputBegan` branch).

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type FocusNodeOptions = {
  onFocusChange?: (focused: boolean) => void;
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

import { MenuItem } from "../../../packages/react/menu/src/Menu/MenuItem";
import { MenuContextProvider, useMenuItemContext } from "../../../packages/react/menu/src/Menu/context";
import type { MenuContextValue } from "../../../packages/react/menu/src/Menu/types";

afterEach(() => {
  cleanup();
  focusNodeOptions.splice(0);
});

function flushDefer() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

type EventTable = {
  Activated: () => void;
  InputBegan?: unknown;
  SelectionGained?: unknown;
  SelectionLost?: unknown;
  MouseEnter: () => void;
  MouseLeave: () => void;
};

// The latest options MenuItem passed to `useFocusNode`; re-registered on every
// render because the callbacks close over fresh props.
function latestFocusNodeOptions() {
  return focusNodeOptions[focusNodeOptions.length - 1];
}

function renderItem(options: {
  onSelect?: (event: { preventDefault: () => void }) => void;
  setOpen?: (open: boolean) => void;
  disabled?: boolean;
}) {
  let itemProps: Record<string, unknown> = {};
  let highlighted = false;

  const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
    itemProps = props;
    highlighted = useMenuItemContext().highlighted;
    return null;
  });
  Probe.displayName = "Probe";

  const menuContext = {
    open: true,
    setOpen: options.setOpen ?? (() => {}),
    modal: true,
    triggerRef: { current: undefined },
    contentRef: { current: undefined },
    registerItem: () => () => {},
    focusFirstItem: () => {},
    restoreTriggerFocus: () => {},
  } as unknown as MenuContextValue;

  const result = render(
    React.createElement(
      MenuContextProvider,
      { value: menuContext },
      React.createElement(
        MenuItem,
        { asChild: true, disabled: options.disabled, onSelect: options.onSelect },
        React.createElement(Probe),
      ),
    ),
  );

  return {
    ...result,
    getProps: () => itemProps,
    getHighlighted: () => highlighted,
  };
}

describe("MenuItem activation and highlight", () => {
  it("does not wire the engine's keyboard or selection events", () => {
    const { getProps } = renderItem({});

    const events = getProps().Event as EventTable;
    expect(events.InputBegan).toBeUndefined();
    expect(events.SelectionGained).toBeUndefined();
    expect(events.SelectionLost).toBeUndefined();
  });

  it("highlights while managed focus is on the item", () => {
    const { getHighlighted } = renderItem({});

    expect(getHighlighted()).toBe(false);

    act(() => {
      latestFocusNodeOptions().onFocusChange?.(true);
    });
    expect(getHighlighted()).toBe(true);

    act(() => {
      latestFocusNodeOptions().onFocusChange?.(false);
    });
    expect(getHighlighted()).toBe(false);
  });

  it("keeps the highlight while the pointer is over the item without focus", () => {
    const { getProps, getHighlighted } = renderItem({});

    act(() => {
      (getProps().Event as EventTable).MouseEnter();
    });
    expect(getHighlighted()).toBe(true);

    act(() => {
      (getProps().Event as EventTable).MouseLeave();
    });
    expect(getHighlighted()).toBe(false);
  });

  it("selects and closes once when the focus node activates", async () => {
    const onSelect = vi.fn();
    const setOpen = vi.fn();
    renderItem({ onSelect, setOpen });

    act(() => {
      latestFocusNodeOptions().onActivate?.();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);

    await act(async () => {
      await flushDefer();
    });
  });

  it("collapses the paired activation the engine fires for one selection", async () => {
    const onSelect = vi.fn();
    const { getProps } = renderItem({ onSelect });

    act(() => {
      latestFocusNodeOptions().onActivate?.();
      (getProps().Event as EventTable).Activated();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);

    // A later, distinct activation is still handled.
    await act(async () => {
      await flushDefer();
    });
    act(() => {
      (getProps().Event as EventTable).Activated();
    });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("stays inert while disabled", () => {
    const onSelect = vi.fn();
    const { getProps } = renderItem({ disabled: true, onSelect });

    act(() => {
      latestFocusNodeOptions().onActivate?.();
      (getProps().Event as EventTable).Activated();
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(getProps().Selectable).toBe(false);
  });

  it("keeps a disabled item unhighlighted even when the pointer is over it", () => {
    const { getProps, getHighlighted } = renderItem({ disabled: true });

    act(() => {
      (getProps().Event as EventTable).MouseEnter();
    });

    expect(getHighlighted()).toBe(false);
  });
});
