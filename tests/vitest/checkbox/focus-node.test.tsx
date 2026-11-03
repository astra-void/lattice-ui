// @vitest-environment jsdom

// Checkbox.Root and Switch.Root register a focus node, so the navigation
// controller can reach them inside a FocusScope (a Dialog, a Popover).

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type FocusNodeOptions = { ref: { current: unknown }; disabled?: boolean };

const focusNodeOptions: FocusNodeOptions[] = [];

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const react = await import("react");

  return {
    composeEvents: runtimeProps.composeEvents,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    getSlotChild: runtimeSlot.getSlotChild,
    useControllableState: controllable.useControllableState,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot: () => null,
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  useFocusNode: (options: FocusNodeOptions) => {
    focusNodeOptions.push(options);
    return { current: undefined };
  },
}));

import { CheckboxRoot } from "../../../packages/react/checkbox/src/Checkbox/CheckboxRoot";
import { SwitchRoot } from "../../../packages/react/switch/src/Switch/SwitchRoot";

afterEach(() => {
  cleanup();
  focusNodeOptions.splice(0);
});

describe.each([
  { name: "Checkbox.Root", Root: CheckboxRoot },
  { name: "Switch.Root", Root: SwitchRoot },
])("$name", ({ Root }) => {
  it("registers a focus node that follows disabled", () => {
    // asChild keeps jsdom from handing a DOM node to the GuiObject ref.
    const renderRoot = (disabled: boolean) =>
      React.createElement(
        Root as React.ComponentType<Record<string, unknown>>,
        { asChild: true, disabled },
        React.createElement("textbutton"),
      );

    const view = render(renderRoot(false));
    expect(focusNodeOptions.at(-1)?.disabled).toBe(false);

    view.rerender(renderRoot(true));
    expect(focusNodeOptions.at(-1)?.disabled).toBe(true);
  });
});
