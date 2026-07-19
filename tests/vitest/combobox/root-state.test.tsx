// @vitest-environment jsdom

// Regression tests: combobox items only mount while the popup is open, so at
// mount time the registry and text cache are empty. The closed-state input
// sync must not run before the popup has opened once — it would erase
// defaultInputValue and emit a spurious onInputValueChange("").

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

import { ComboboxRoot } from "../../../packages/react/combobox/src/Combobox/ComboboxRoot";
import { useComboboxContext } from "../../../packages/react/combobox/src/Combobox/context";
import type { ComboboxContextValue } from "../../../packages/react/combobox/src/Combobox/types";

afterEach(() => {
  cleanup();
});

function renderCombobox(rootProps: Record<string, unknown>) {
  let context: ComboboxContextValue | undefined;

  function Probe() {
    context = useComboboxContext();
    return null;
  }

  const view = render(
    React.createElement(ComboboxRoot, rootProps as never, React.createElement(Probe)),
  );

  return { view, getContext: () => context! };
}

function makeItem(overrides: { id: number; value: string; text: string }) {
  return {
    id: overrides.id,
    value: overrides.value,
    order: overrides.id,
    getDisabled: () => false,
    getTextValue: () => overrides.text,
    getInstance: () => undefined,
  };
}

describe("ComboboxRoot closed-state input sync", () => {
  it("preserves defaultInputValue at mount", () => {
    const onInputValueChange = vi.fn();
    const { getContext } = renderCombobox({
      defaultInputValue: "hello",
      onInputValueChange,
    });

    expect(getContext().inputValue).toBe("hello");
    expect(onInputValueChange).not.toHaveBeenCalled();
  });

  it("keeps defaultValue at mount even though its label is not resolvable yet", () => {
    const { getContext } = renderCombobox({ defaultValue: "beta" });

    expect(getContext().value).toBe("beta");
  });

  it("syncs the input to the selected label after the popup opens and closes", () => {
    const { getContext } = renderCombobox({ defaultValue: "beta" });

    act(() => {
      getContext().setOpen(true);
    });
    act(() => {
      getContext().registerItem(makeItem({ id: 1, value: "beta", text: "Beta Option" }));
    });
    act(() => {
      getContext().setOpen(false);
    });

    expect(getContext().inputValue).toBe("Beta Option");
  });

  it("retains the selected label in the text cache after items unregister", () => {
    const { getContext } = renderCombobox({ defaultValue: "beta" });

    let unregister: (() => void) | undefined;
    act(() => {
      getContext().setOpen(true);
    });
    act(() => {
      unregister = getContext().registerItem(makeItem({ id: 1, value: "beta", text: "Beta Option" }));
    });
    act(() => {
      unregister!();
      getContext().setOpen(false);
    });

    // The cache keeps the label so the closed-state sync can resolve it even
    // though the item itself is unmounted.
    expect(getContext().inputValue).toBe("Beta Option");
  });
});
