// @vitest-environment jsdom

// Select moves focus into its list once per open: onto the selected item when
// it can take focus, else onto the first enabled item.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const focused: unknown[] = [];

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
  getFirstOrderedSelectionEntry: (entries: Array<{ getDisabled: () => boolean }>) =>
    entries.find((entry) => !entry.getDisabled()),
  focusOrderedSelectionEntry: (entry: unknown) => {
    focused.push(entry);
  },
}));

import { SelectRoot } from "../../../packages/react/select/src/Select/SelectRoot";
import { useSelectContext } from "../../../packages/react/select/src/Select/context";
import type { SelectContextValue } from "../../../packages/react/select/src/Select/types";

afterEach(() => {
  cleanup();
  focused.splice(0);
});

function makeItem(id: number, value: string, disabled = false) {
  return {
    id,
    value,
    order: id,
    ref: { current: undefined },
    getDisabled: () => disabled,
    getTextValue: () => value,
  };
}

function renderSelect(rootProps: Record<string, unknown>) {
  let context: SelectContextValue | undefined;
  function Probe() {
    context = useSelectContext();
    return null;
  }
  render(React.createElement(SelectRoot, rootProps as never, React.createElement(Probe)));
  return () => context!;
}

describe("Select open focus", () => {
  it("focuses the selected item once per open", () => {
    const getContext = renderSelect({ defaultOpen: true, defaultValue: "beta" });
    const beta = makeItem(2, "beta");

    act(() => {
      getContext().registerItem(makeItem(1, "alpha"));
      getContext().registerItem(beta);
    });
    expect(focused).toEqual([beta]);

    act(() => {
      getContext().registerItem(makeItem(3, "gamma"));
    });
    expect(focused).toEqual([beta]);
  });

  it("falls back to the first enabled item when the selection is disabled", () => {
    const getContext = renderSelect({ defaultOpen: true, defaultValue: "beta" });
    const alpha = makeItem(1, "alpha");

    act(() => {
      getContext().registerItem(alpha);
      getContext().registerItem(makeItem(2, "beta", true));
    });

    expect(focused[0]).toBe(alpha);
  });
});
