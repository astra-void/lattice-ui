// @vitest-environment jsdom

// Gamepad/keyboard activation tests for ToggleGroupItem. After the gamepad fix
// the item is `Selectable` and routes `Activated` + the `Return`/`Space`
// `InputBegan` branch through one guarded toggle, so a single selection
// activation (which fires BOTH events) presses the toggle once rather than
// flipping it and immediately flipping it back.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    useFocusNode: () => ({ current: undefined }),
  };
});

vi.mock("@lattice-ui/react-motion", () => ({
  createSelectionResponseRecipe: () => ({}),
  useResponseMotion: () => ({ current: undefined }),
}));

import { ToggleGroupContextProvider } from "../../../packages/react/toggle-group/src/ToggleGroup/context";
import { ToggleGroupItem } from "../../../packages/react/toggle-group/src/ToggleGroup/ToggleGroupItem";
import type { ToggleGroupContextValue } from "../../../packages/react/toggle-group/src/ToggleGroup/types";

afterEach(() => {
  cleanup();
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
    isPressed: () => false,
    toggleValue: vi.fn(),
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
