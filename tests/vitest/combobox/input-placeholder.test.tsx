// @vitest-environment jsdom

// Combobox.Input only sets PlaceholderText when `placeholder` is given. Behavior
// props spread after passthrough, so an unconditional `placeholder ?? ""` wiped a
// consumer's own PlaceholderText (passthrough or asChild child).

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const slotProps: Record<string, unknown>[] = [];

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const react = await import("react");

  // Records the props the primitive forwards to an asChild child, merged the
  // way Slot merges them (slot props over the child's own props).
  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...forwarded } = props;
    const childProps = react.default.isValidElement(children) ? (children.props as Record<string, unknown>) : {};
    slotProps.push({ ...childProps, ...forwarded });
    return null;
  }

  return {
    composeEvents: runtimeProps.composeEvents,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot,
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  useFocusNode: () => ({ current: undefined }),
}));

import { ComboboxContextProvider } from "../../../packages/react/combobox/src/Combobox/context";
import { ComboboxInput } from "../../../packages/react/combobox/src/Combobox/ComboboxInput";

afterEach(() => {
  cleanup();
  slotProps.splice(0);
});

function makeContext() {
  return {
    open: false,
    setOpen: vi.fn(),
    value: undefined,
    setValue: vi.fn(),
    inputValue: "",
    setInputValue: vi.fn(),
    disabled: false,
    readOnly: false,
    required: false,
    inputRef: { current: undefined },
    triggerRef: { current: undefined },
    anchorRef: { current: undefined },
    contentRef: { current: undefined },
    moveHighlight: vi.fn(),
    commitHighlight: vi.fn(),
  };
}

function renderInput(props: Record<string, unknown>, child: React.ReactElement) {
  render(
    React.createElement(
      ComboboxContextProvider,
      { value: makeContext() as never },
      React.createElement(ComboboxInput as React.ComponentType<Record<string, unknown>>, { asChild: true, ...props }, child),
    ),
  );

  return slotProps.at(-1)!;
}

describe("Combobox.Input PlaceholderText", () => {
  it("keeps the asChild child's PlaceholderText when no placeholder is given", () => {
    const forwarded = renderInput({}, React.createElement("textbox", { PlaceholderText: "Search" }));
    expect(forwarded.PlaceholderText).toBe("Search");
  });

  it("keeps a passthrough PlaceholderText when no placeholder is given", () => {
    const forwarded = renderInput({ PlaceholderText: "Search" }, React.createElement("textbox"));
    expect(forwarded.PlaceholderText).toBe("Search");
  });

  it("applies the placeholder prop when given", () => {
    const forwarded = renderInput({ placeholder: "Find a fruit" }, React.createElement("textbox"));
    expect(forwarded.PlaceholderText).toBe("Find a fruit");
  });
});
