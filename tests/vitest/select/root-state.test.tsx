// @vitest-environment jsdom

// Regression tests: Select items live inside Select.Content and unmount
// whenever the popup closes, so an empty item registry is the DEFAULT state.
// The value-validation effect must not treat it as "selected item vanished".

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

import { SelectRoot } from "../../../packages/react/select/src/Select/SelectRoot";
import { useSelectContext } from "../../../packages/react/select/src/Select/context";
import type { SelectContextValue } from "../../../packages/react/select/src/Select/types";

afterEach(() => {
  cleanup();
});

function renderSelect(rootProps: Record<string, unknown>) {
  let context: SelectContextValue | undefined;

  function Probe() {
    context = useSelectContext();
    return null;
  }

  const view = render(
    React.createElement(SelectRoot, rootProps as never, React.createElement(Probe)),
  );

  return { view, getContext: () => context! };
}

function makeItem(overrides: { id: number; value: string; disabled?: boolean; textValue?: string }) {
  return {
    id: overrides.id,
    value: overrides.value,
    order: overrides.id,
    getDisabled: () => overrides.disabled === true,
    getTextValue: () => overrides.textValue ?? overrides.value,
  };
}

describe("SelectRoot value retention", () => {
  it("keeps defaultValue when no items are registered (popup closed at mount)", () => {
    const { getContext } = renderSelect({ defaultValue: "beta" });

    expect(getContext().value).toBe("beta");
  });

  it("keeps the selected value after all items unregister (popup closes)", () => {
    const { getContext } = renderSelect({ defaultValue: "beta" });

    let unregisterAlpha: (() => void) | undefined;
    let unregisterBeta: (() => void) | undefined;

    // Popup opens: items register.
    act(() => {
      unregisterAlpha = getContext().registerItem(makeItem({ id: 1, value: "alpha" }));
      unregisterBeta = getContext().registerItem(makeItem({ id: 2, value: "beta" }));
    });
    expect(getContext().value).toBe("beta");

    // Popup closes: items unregister — value must survive.
    act(() => {
      unregisterAlpha!();
      unregisterBeta!();
    });
    expect(getContext().value).toBe("beta");
  });

  it("still falls back when the registry is non-empty and the value is invalid", () => {
    const { getContext } = renderSelect({ defaultValue: "ghost" });

    act(() => {
      getContext().registerItem(makeItem({ id: 1, value: "alpha" }));
      getContext().registerItem(makeItem({ id: 2, value: "beta" }));
    });

    expect(getContext().value).toBe("alpha");
  });

  it("still falls back off a disabled selected item", () => {
    const { getContext } = renderSelect({ defaultValue: "beta" });

    act(() => {
      getContext().registerItem(makeItem({ id: 1, value: "alpha" }));
      getContext().registerItem(makeItem({ id: 2, value: "beta", disabled: true }));
    });

    expect(getContext().value).toBe("alpha");
  });

  it("keeps resolving the selected item's textValue after the popup closes", () => {
    const { getContext } = renderSelect({ defaultValue: "dark" });

    let unregisterLight: (() => void) | undefined;
    let unregisterDark: (() => void) | undefined;

    act(() => {
      unregisterLight = getContext().registerItem(makeItem({ id: 1, value: "light", textValue: "Light" }));
      unregisterDark = getContext().registerItem(makeItem({ id: 2, value: "dark", textValue: "Dark" }));
    });
    expect(getContext().getItemText("dark")).toBe("Dark");

    act(() => {
      unregisterLight!();
      unregisterDark!();
    });

    expect(getContext().getItemText("dark")).toBe("Dark");
    expect(getContext().getItemText("light")).toBe("Light");
  });
});
