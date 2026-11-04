// @vitest-environment jsdom
// @ts-nocheck

// Tabs and RadioGroup rove through their items with the orderedSelection
// helpers. Items sort by tree order (sibling LayoutOrder), so an item that
// mounts later still sits where the layout shows it. Items also register once:
// a value change must not unregister and re-register every item.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    Slot: () => null,
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  useFocusNode: () => ({ current: undefined }),
}));

vi.mock("../../../packages/react/tabs/src/Tabs/internals/ids", () => ({
  createTabsTriggerName: (value: string) => `TabsTrigger:${value}`,
}));

import { getRelativeOrderedSelectionEntry } from "../../../packages/react/focus/src/orderedSelection";
import { RadioGroupContextProvider } from "../../../packages/react/radio-group/src/RadioGroup/context";
import { RadioGroupItem } from "../../../packages/react/radio-group/src/RadioGroup/RadioGroupItem";
import { TabsContextProvider } from "../../../packages/react/tabs/src/Tabs/context";
import { TabsTrigger } from "../../../packages/react/tabs/src/Tabs/TabsTrigger";

afterEach(() => {
  cleanup();
});

function createGuiObject(name: string, parent: unknown, layoutOrder = 0) {
  return {
    Name: name,
    Parent: parent,
    Visible: true,
    Selectable: true,
    LayoutOrder: layoutOrder,
    IsA: (className: string) => className === "GuiObject" || className === "Instance",
    FindFirstChildWhichIsA: () => undefined,
  };
}

describe("orderedSelection", () => {
  it("steps to an entry that mounted later in the middle of the list", () => {
    const list = createGuiObject("list", { Parent: undefined, IsA: () => false });
    const entries = [
      { id: 1, order: 1, ref: { current: createGuiObject("a", list, 1) } },
      { id: 2, order: 2, ref: { current: createGuiObject("c", list, 3) } },
    ];
    // Mounted after "c", laid out between "a" and "c".
    entries.push({ id: 3, order: 3, ref: { current: createGuiObject("b", list, 2) } });

    expect(getRelativeOrderedSelectionEntry(entries, 1, 1)?.id).toBe(3);
    expect(getRelativeOrderedSelectionEntry(entries, 3, 1)?.id).toBe(2);
    expect(getRelativeOrderedSelectionEntry(entries, 2, -1)?.id).toBe(3);
  });

  it("keeps registration order for siblings that tie on LayoutOrder", () => {
    const list = createGuiObject("list", { Parent: undefined, IsA: () => false });
    const entries = [
      { id: 1, order: 1, ref: { current: createGuiObject("z", list) } },
      { id: 2, order: 2, ref: { current: createGuiObject("y", list) } },
      { id: 3, order: 3, ref: { current: undefined } },
    ];

    expect(getRelativeOrderedSelectionEntry(entries, 1, 1)?.id).toBe(2);
    expect(getRelativeOrderedSelectionEntry(entries, undefined, -1)?.id).toBe(2);
  });
});

describe("item registration", () => {
  it("Tabs.Trigger registers once across value changes", () => {
    const registerTrigger = vi.fn(() => () => {});
    const renderTrigger = (value: string) =>
      React.createElement(
        TabsContextProvider,
        {
          value: { value, orientation: "horizontal", setValue: vi.fn(), registerTrigger, moveSelection: vi.fn() },
        },
        React.createElement(TabsTrigger, { value: "a", asChild: true }, React.createElement("textbutton")),
      );

    const view = render(renderTrigger("a"));
    act(() => {
      view.rerender(renderTrigger("b"));
    });
    act(() => {
      view.rerender(renderTrigger("a"));
    });

    expect(registerTrigger).toHaveBeenCalledTimes(1);
  });

  it("RadioGroup.Item registers once across value changes", () => {
    const registerItem = vi.fn(() => () => {});
    const renderItem = (value: string) =>
      React.createElement(
        RadioGroupContextProvider,
        {
          value: {
            value,
            setValue: vi.fn(),
            disabled: false,
            required: false,
            orientation: "vertical",
            registerItem,
            moveSelection: vi.fn(),
          },
        },
        React.createElement(RadioGroupItem, { value: "a", asChild: true }, React.createElement("textbutton")),
      );

    const view = render(renderItem("a"));
    act(() => {
      view.rerender(renderItem("b"));
    });

    expect(registerItem).toHaveBeenCalledTimes(1);
  });
});
