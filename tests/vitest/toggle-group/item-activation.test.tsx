// @vitest-environment jsdom

// Gamepad/keyboard activation tests for ToggleGroupItem. After the gamepad fix
// the item is `Selectable` and routes `Activated` + the `Return`/`Space`
// `InputBegan` branch through one guarded toggle, so a single selection
// activation (which fires BOTH events) presses the toggle once rather than
// flipping it and immediately flipping it back.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const react = await import("react");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");

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
    getSlotChild: runtimeSlot.getSlotChild,
    useControllableState: controllable.useControllableState,
  };
});

const focusedEntries = vi.hoisted(() => new Array<unknown>());

vi.mock("@lattice-ui/react-focus", async () => {
  const guard = await import("../../../packages/react/focus/src/useActivationGuard");
  const ordered = await import("../../../packages/react/focus/src/orderedSelection");
  return {
    findOrderedSelectionEntry: ordered.findOrderedSelectionEntry,
    focusOrderedSelectionEntry: (entry: unknown) => focusedEntries.push(entry),
    getRelativeOrderedSelectionEntry: ordered.getRelativeOrderedSelectionEntry,
    useActivationGuard: guard.useActivationGuard,
    useFocusNode: () => ({ current: undefined }),
  };
});

vi.mock("@lattice-ui/react-motion", () => ({
  createSelectionResponseRecipe: () => ({}),
  useResponseMotion: () => ({ current: undefined }),
}));

import {
  ToggleGroupContextProvider,
  useToggleGroupContext,
} from "../../../packages/react/toggle-group/src/ToggleGroup/context";
import { ToggleGroupItem } from "../../../packages/react/toggle-group/src/ToggleGroup/ToggleGroupItem";
import { ToggleGroupRoot } from "../../../packages/react/toggle-group/src/ToggleGroup/ToggleGroupRoot";
import type { ToggleGroupContextValue } from "../../../packages/react/toggle-group/src/ToggleGroup/types";

beforeEach(() => {
  Object.assign((Enum as unknown as { KeyCode: Record<string, string> }).KeyCode, {
    Up: "Up",
    Down: "Down",
    Left: "Left",
    Right: "Right",
  });
});

afterEach(() => {
  cleanup();
  focusedEntries.splice(0);
});

const RETURN = "Return";

function flushDefer() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

type EventTable = {
  Activated: () => void;
  InputBegan: (rbx: unknown, input: { KeyCode: string }) => void;
};

function captureChildProps() {
  let received: Record<string, unknown> | undefined;
  const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
    received = props;
    return null;
  });
  Probe.displayName = "Probe";
  return { Probe, getProps: () => received ?? {} };
}

function makeContext(overrides: Partial<ToggleGroupContextValue> = {}): ToggleGroupContextValue {
  return {
    type: "single",
    disabled: false,
    orientation: "horizontal",
    isPressed: () => false,
    toggleValue: vi.fn(),
    registerItem: () => () => {},
    moveFocus: vi.fn(),
    ...overrides,
  };
}

function renderItem(context: ToggleGroupContextValue, itemProps: Record<string, unknown>, child: React.ReactElement) {
  return render(
    React.createElement(
      ToggleGroupContextProvider,
      { value: context },
      React.createElement(ToggleGroupItem, { asChild: true, ...itemProps }, child),
    ),
  );
}

describe("ToggleGroupItem gamepad activation", () => {
  it("is selectable and active when enabled", () => {
    const { Probe, getProps } = captureChildProps();
    renderItem(makeContext(), { value: "bold" }, React.createElement(Probe));

    expect(getProps().Selectable).toBe(true);
    expect(getProps().Active).toBe(true);
  });

  it("is not selectable when disabled", () => {
    const { Probe, getProps } = captureChildProps();
    renderItem(makeContext({ disabled: true }), { value: "bold" }, React.createElement(Probe));

    expect(getProps().Selectable).toBe(false);
  });

  it("toggles once when one activation fires Activated and InputBegan", async () => {
    const toggleValue = vi.fn();
    const { Probe, getProps } = captureChildProps();
    renderItem(makeContext({ toggleValue }), { value: "italic" }, React.createElement(Probe));

    const events = getProps().Event as EventTable;
    act(() => {
      events.Activated();
      events.InputBegan({}, { KeyCode: RETURN });
    });

    expect(toggleValue).toHaveBeenCalledTimes(1);
    expect(toggleValue).toHaveBeenCalledWith("italic");

    await act(async () => {
      await flushDefer();
    });
    act(() => {
      events.Activated();
    });
    expect(toggleValue).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled", () => {
    const toggleValue = vi.fn();
    const { Probe, getProps } = captureChildProps();
    renderItem(makeContext({ disabled: true, toggleValue }), { value: "italic" }, React.createElement(Probe));

    const events = getProps().Event as EventTable;
    act(() => {
      events.Activated();
      events.InputBegan({}, { KeyCode: RETURN });
    });

    expect(toggleValue).not.toHaveBeenCalled();
  });
});

describe("ToggleGroupItem roving arrows", () => {
  it("moves focus along a horizontal group without toggling", () => {
    const toggleValue = vi.fn();
    const moveFocus = vi.fn();
    const { Probe, getProps } = captureChildProps();
    renderItem(makeContext({ toggleValue, moveFocus }), { value: "bold" }, React.createElement(Probe));

    const events = getProps().Event as EventTable;
    act(() => {
      events.InputBegan({}, { KeyCode: "Right" });
      events.InputBegan({}, { KeyCode: "Left" });
      events.InputBegan({}, { KeyCode: "Down" });
    });

    expect(moveFocus.mock.calls).toEqual([
      ["bold", 1],
      ["bold", -1],
    ]);
    expect(toggleValue).not.toHaveBeenCalled();
  });

  it("uses Up/Down when vertical", () => {
    const moveFocus = vi.fn();
    const { Probe, getProps } = captureChildProps();
    renderItem(makeContext({ orientation: "vertical", moveFocus }), { value: "bold" }, React.createElement(Probe));

    const events = getProps().Event as EventTable;
    act(() => {
      events.InputBegan({}, { KeyCode: "Up" });
      events.InputBegan({}, { KeyCode: "Right" });
      events.InputBegan({}, { KeyCode: "Down" });
    });

    expect(moveFocus.mock.calls).toEqual([
      ["bold", -1],
      ["bold", 1],
    ]);
  });

  it("registers once across pressing changes", () => {
    const registerItem = vi.fn(() => () => {});
    const { Probe } = captureChildProps();
    const context = makeContext({ registerItem });
    const view = renderItem(context, { value: "bold" }, React.createElement(Probe));

    view.rerender(
      React.createElement(
        ToggleGroupContextProvider,
        { value: { ...context, isPressed: () => true } },
        React.createElement(ToggleGroupItem, { asChild: true, value: "bold" }, React.createElement(Probe)),
      ),
    );

    expect(registerItem).toHaveBeenCalledTimes(1);
    expect(registerItem.mock.calls[0][0]).toMatchObject({ value: "bold" });
  });
});

describe("ToggleGroup.Root roving", () => {
  function createGuiObject(name: string, parent: unknown, layoutOrder: number, selectable = true) {
    return {
      Name: name,
      Parent: parent,
      Visible: true,
      Selectable: selectable,
      LayoutOrder: layoutOrder,
      IsA: (className: string) => className === "GuiObject" || className === "Instance",
      FindFirstChildWhichIsA: () => undefined,
    };
  }

  it("focuses the next available item in layout order and leaves pressing alone", () => {
    let context: ToggleGroupContextValue | undefined;
    function Capture() {
      context = useToggleGroupContext();
      return null;
    }

    const onValueChange = vi.fn();
    render(
      React.createElement(
        ToggleGroupRoot,
        { type: "single", defaultValue: "bold", onValueChange, asChild: true },
        React.createElement(Capture),
      ),
    );

    const list = createGuiObject("list", { Parent: undefined, IsA: () => false }, 0, false);
    const entry = (id: number, value: string, layoutOrder: number, disabled = false) => ({
      id,
      value,
      order: id,
      ref: { current: createGuiObject(value, list, layoutOrder) },
      getDisabled: () => disabled,
    });
    act(() => {
      context?.registerItem(entry(1, "bold", 1));
      context?.registerItem(entry(2, "underline", 4));
      context?.registerItem(entry(3, "italic", 2, true));
      // Mounted last, laid out third.
      context?.registerItem(entry(4, "strike", 3));
    });

    act(() => {
      context?.moveFocus("bold", 1);
    });
    expect((focusedEntries.at(-1) as { value: string }).value).toBe("strike");

    act(() => {
      context?.moveFocus("underline", -1);
    });
    expect((focusedEntries.at(-1) as { value: string }).value).toBe("strike");

    expect(context?.orientation).toBe("horizontal");
    expect(context?.isPressed("bold")).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
