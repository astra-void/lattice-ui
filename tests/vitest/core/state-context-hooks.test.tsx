// @vitest-environment jsdom

// Primitives ship no built-in visuals, so the state those visuals were driven by
// is exposed through context hooks instead (DEV-109): a selected tab, a pressed
// toggle, a focused text field. Consumers read it from inside the part, with no
// need to mirror `onValueChange` or track focus themselves.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  const react = await import("react");

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
    createStrictContext: strictContext.createStrictContext,
    useControllableState: controllable.useControllableState,
    flushSync: (callback: () => void) => callback(),
    React: react.default,
    Slot,
  };
});

vi.mock("@lattice-ui/react-focus", async () => {
  const guard = await import("../../../packages/react/focus/src/useActivationGuard");
  const ordered = await import("../../../packages/react/focus/src/orderedSelection");
  return {
    findOrderedSelectionEntry: ordered.findOrderedSelectionEntry,
    focusOrderedSelectionEntry: () => undefined,
    getOrderedSelectionEntries: ordered.getOrderedSelectionEntries,
    getRelativeOrderedSelectionEntry: ordered.getRelativeOrderedSelectionEntry,
    isNativeSelectionChange: () => false,
    useActivationGuard: guard.useActivationGuard,
    useFocusNode: () => ({ current: undefined }),
  };
});

// The real helper sanitizes with Luau's string.gsub, which the shim does not provide.
vi.mock("../../../packages/react/tabs/src/Tabs/internals/ids", () => ({
  createTabsTriggerName: (value: string) => `TabsTrigger:${value}`,
  createTabsContentName: (value: string) => `TabsContent:${value}`,
}));

import { useTabsTriggerContext } from "../../../packages/react/tabs/src/Tabs/context";
import { TabsRoot } from "../../../packages/react/tabs/src/Tabs/TabsRoot";
import { TabsTrigger } from "../../../packages/react/tabs/src/Tabs/TabsTrigger";
import { useTextFieldContext } from "../../../packages/react/text-field/src/TextField/context";
import { TextFieldInput } from "../../../packages/react/text-field/src/TextField/TextFieldInput";
import { TextFieldRoot } from "../../../packages/react/text-field/src/TextField/TextFieldRoot";
import { useToggleGroupItemContext } from "../../../packages/react/toggle-group/src/ToggleGroup/context";
import { ToggleGroupItem } from "../../../packages/react/toggle-group/src/ToggleGroup/ToggleGroupItem";
import { ToggleGroupRoot } from "../../../packages/react/toggle-group/src/ToggleGroup/ToggleGroupRoot";

afterEach(() => {
  cleanup();
});

type Events = Record<string, ((...args: unknown[]) => void) | undefined>;

// A slotted child that records the props the part handed it and the state it reads from context.
function createProbe<T>(useState: () => T) {
  const seen = { props: {} as Record<string, unknown>, state: undefined as T | undefined };
  const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
    seen.props = props;
    seen.state = useState();
    return null;
  });
  Probe.displayName = "Probe";
  return { Probe, seen };
}

describe("useTabsTriggerContext", () => {
  it("reports which trigger is selected, uncontrolled", () => {
    const alpha = createProbe(useTabsTriggerContext);
    const beta = createProbe(useTabsTriggerContext);

    render(
      React.createElement(
        TabsRoot,
        { defaultValue: "alpha" },
        React.createElement(TabsTrigger, { asChild: true, value: "alpha" }, React.createElement(alpha.Probe)),
        React.createElement(TabsTrigger, { asChild: true, value: "beta", disabled: true }, React.createElement(beta.Probe)),
      ),
    );

    expect(alpha.seen.state).toEqual({ value: "alpha", selected: true, disabled: false });
    expect(beta.seen.state).toEqual({ value: "beta", selected: false, disabled: true });
  });
});

describe("useToggleGroupItemContext", () => {
  it("follows the pressed state when the item is toggled", () => {
    const bold = createProbe(useToggleGroupItemContext);

    render(
      React.createElement(
        ToggleGroupRoot,
        { type: "multiple" },
        React.createElement(ToggleGroupItem, { asChild: true, value: "bold" }, React.createElement(bold.Probe)),
      ),
    );

    expect(bold.seen.state).toEqual({ value: "bold", pressed: false, disabled: false });

    act(() => {
      (bold.seen.props.Event as Events).Activated?.();
    });

    expect(bold.seen.state?.pressed).toBe(true);
  });
});

describe("useTextFieldContext", () => {
  it("exposes focus, which the Input tracks on the Root", () => {
    const input = createProbe(() => undefined);
    const observer = createProbe(useTextFieldContext);

    render(
      React.createElement(
        TextFieldRoot,
        { invalid: true, required: true },
        React.createElement(TextFieldInput, { asChild: true }, React.createElement(input.Probe)),
        React.createElement(observer.Probe),
      ),
    );

    expect(observer.seen.state).toMatchObject({ focused: false, invalid: true, required: true });

    act(() => {
      (input.seen.props.Event as Events).Focused?.();
    });
    expect(observer.seen.state?.focused).toBe(true);

    act(() => {
      (input.seen.props.Event as Events).FocusLost?.({ Text: "" });
    });
    expect(observer.seen.state?.focused).toBe(false);
  });
});
