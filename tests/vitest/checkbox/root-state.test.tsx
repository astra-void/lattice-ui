// @vitest-environment jsdom

// Checkbox.Root state: Activated toggles, indeterminate resolves to checked,
// controlled mode reports without committing, and disabled ignores input.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
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
    getSlotChild: runtimeSlot.getSlotChild,
    useControllableState: controllable.useControllableState,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot,
  };
});

vi.mock("@lattice-ui/react-focus", () => ({
  useFocusNode: () => ({ current: undefined }),
}));

import { CheckboxRoot } from "../../../packages/react/checkbox/src/Checkbox/CheckboxRoot";
import { useCheckboxContext } from "../../../packages/react/checkbox/src/Checkbox/context";

afterEach(() => {
  cleanup();
});

type ChildProps = {
  Active?: boolean;
  Selectable?: boolean;
  Event?: { Activated?: () => void };
};

// Renders the root with an asChild probe and records the props it hands the
// child and the state it publishes through context.
function renderCheckbox(rootProps: Record<string, unknown>) {
  const seen: { child: ChildProps; context?: ReturnType<typeof useCheckboxContext> } = { child: {} };

  function StateProbe() {
    seen.context = useCheckboxContext();
    return null;
  }

  const Probe = React.forwardRef<unknown, ChildProps & { children?: React.ReactNode }>((props, _ref) => {
    seen.child = props;
    return React.createElement(React.Fragment, undefined, props.children);
  });
  Probe.displayName = "Probe";

  const element = (props: Record<string, unknown>) =>
    React.createElement(
      CheckboxRoot as React.ComponentType<Record<string, unknown>>,
      { asChild: true, ...props },
      React.createElement(Probe, undefined, React.createElement(StateProbe)),
    );

  const result = render(element(rootProps));
  const activate = () => act(() => seen.child.Event?.Activated?.());
  return { seen, activate, rerender: (props: Record<string, unknown>) => result.rerender(element(props)) };
}

describe("Checkbox.Root state", () => {
  it("toggles between unchecked and checked on Activated", () => {
    const onCheckedChange = vi.fn();
    const { seen, activate } = renderCheckbox({ onCheckedChange });

    expect(seen.context?.checked).toBe(false);
    activate();
    expect(seen.context?.checked).toBe(true);
    activate();
    expect(seen.context?.checked).toBe(false);
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
  });

  it("resolves indeterminate to checked", () => {
    const onCheckedChange = vi.fn();
    const { seen, activate } = renderCheckbox({ defaultChecked: "indeterminate", onCheckedChange });

    expect(seen.context?.checked).toBe("indeterminate");
    activate();
    expect(seen.context?.checked).toBe(true);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("reports the next state in controlled mode without committing it", () => {
    const onCheckedChange = vi.fn();
    const { seen, activate, rerender } = renderCheckbox({ checked: false, onCheckedChange });

    activate();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(seen.context?.checked).toBe(false);

    rerender({ checked: true, onCheckedChange });
    expect(seen.context?.checked).toBe(true);
  });

  it("ignores activation and context writes while disabled", () => {
    const onCheckedChange = vi.fn();
    const { seen, activate } = renderCheckbox({ disabled: true, onCheckedChange });

    expect(seen.child.Active).toBe(false);
    expect(seen.child.Selectable).toBe(false);
    activate();
    act(() => seen.context?.setChecked(true));
    expect(seen.context?.checked).toBe(false);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("publishes required and disabled through context", () => {
    const { seen } = renderCheckbox({ required: true });

    expect(seen.context?.required).toBe(true);
    expect(seen.context?.disabled).toBe(false);
    expect(seen.child.Active).toBe(true);
    expect(seen.child.Selectable).toBe(true);
  });
});
