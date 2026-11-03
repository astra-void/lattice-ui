// @vitest-environment jsdom

// ContextMenuItem mirrors MenuItem: it registers a focus node so the navigation
// controller can reach it inside the content's ordered scope, the highlight
// follows managed focus, and keyboard/gamepad activation arrives via `onActivate`.

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

import { ContextMenuItem } from "../../../packages/react/context-menu/src/ContextMenu/ContextMenuItem";
import {
  ContextMenuContextProvider,
  useContextMenuItemContext,
} from "../../../packages/react/context-menu/src/ContextMenu/context";
import type { ContextMenuContextValue } from "../../../packages/react/context-menu/src/ContextMenu/types";

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
  registerItem?: () => () => void;
}) {
  let itemProps: Record<string, unknown> = {};
  let highlighted = false;

  const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
    itemProps = props;
    highlighted = useContextMenuItemContext().highlighted;
    return null;
  });
  Probe.displayName = "Probe";

  const contextMenuContext = {
    open: true,
    setOpen: options.setOpen ?? (() => {}),
    modal: true,
    registerItem: options.registerItem ?? (() => () => {}),
  } as unknown as ContextMenuContextValue;

  const result = render(
    React.createElement(
      ContextMenuContextProvider,
      { value: contextMenuContext },
      React.createElement(ContextMenuItem, { asChild: true, onSelect: options.onSelect }, React.createElement(Probe)),
    ),
  );

  return {
    ...result,
    getProps: () => itemProps,
    getHighlighted: () => highlighted,
  };
}

describe("ContextMenuItem focus integration", () => {
  it("registers with the root and as a selectable focus node", () => {
    const registerItem = vi.fn(() => () => {});
    const { getProps } = renderItem({ registerItem });

    expect(registerItem).toHaveBeenCalledTimes(1);
    expect(focusNodeOptions.length).toBeGreaterThan(0);
    expect(getProps().Selectable).toBe(true);
  });

  it("highlights while managed focus is on the item", () => {
    const { getHighlighted } = renderItem({});

    act(() => {
      latestFocusNodeOptions().onFocusChange?.(true);
    });
    expect(getHighlighted()).toBe(true);

    act(() => {
      latestFocusNodeOptions().onFocusChange?.(false);
    });
    expect(getHighlighted()).toBe(false);
  });

  it("selects and closes once when focus activation and Activated pair up", async () => {
    const onSelect = vi.fn();
    const setOpen = vi.fn();
    const { getProps } = renderItem({ onSelect, setOpen });

    act(() => {
      latestFocusNodeOptions().onActivate?.();
      (getProps().Event as EventTable).Activated();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);

    await act(async () => {
      await flushDefer();
    });
  });
});
