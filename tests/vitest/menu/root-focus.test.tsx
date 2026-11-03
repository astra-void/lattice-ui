// @vitest-environment jsdom

// Menu moves focus to its first item once per open. Items that mount or
// unmount while the menu stays open (e.g. "Show more" calling preventDefault)
// must not pull focus back to the first item.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const focusedEntries: unknown[] = [];

vi.mock("@lattice-ui/react-runtime", async () => {
  const react = await import("react");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  const strictContext = await import("../../../packages/react/runtime/src/context");

  return {
    React: react.default,
    useControllableState: controllable.useControllableState,
    createStrictContext: strictContext.createStrictContext,
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  focusGuiObject: () => undefined,
  getFirstOrderedSelectionEntry: (entries: Array<{ getDisabled?: () => boolean }>) =>
    entries.find((entry) => entry.getDisabled?.() !== true),
  focusOrderedSelectionEntry: (entry: unknown) => {
    focusedEntries.push(entry);
  },
}));

import { Menu } from "../../../packages/react/menu/src/Menu/MenuRoot";
import { useMenuContext } from "../../../packages/react/menu/src/Menu/context";
import type { MenuContextValue } from "../../../packages/react/menu/src/Menu/types";

afterEach(() => {
  cleanup();
  focusedEntries.splice(0);
});

function makeItem(id: number) {
  return { id, order: id, ref: { current: undefined }, getDisabled: () => false };
}

function renderMenu(open: boolean) {
  let context: MenuContextValue | undefined;

  function Probe() {
    context = useMenuContext();
    return null;
  }

  const view = render(React.createElement(Menu, { open, children: React.createElement(Probe) }));
  return {
    rerender: (nextOpen: boolean) =>
      view.rerender(React.createElement(Menu, { open: nextOpen, children: React.createElement(Probe) })),
    getContext: () => context!,
  };
}

describe("Menu first-item focus", () => {
  it("focuses the first item once per open, not on later registry changes", () => {
    const { getContext, rerender } = renderMenu(true);
    const first = makeItem(1);

    act(() => {
      getContext().registerItem(first);
      getContext().registerItem(makeItem(2));
    });
    expect(focusedEntries).toEqual([first]);

    act(() => {
      getContext().registerItem(makeItem(3));
    });
    expect(focusedEntries).toEqual([first]);

    rerender(false);
    rerender(true);
    expect(focusedEntries).toEqual([first, first]);
  });
});
