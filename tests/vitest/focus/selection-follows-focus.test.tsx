// @vitest-environment jsdom
// @ts-nocheck

// Tabs.Trigger and RadioGroup.Item select on focus, but only on focus the user
// moved. A trapped scope (a Dialog) seeding focus on its first item is
// programmatic and must not change the value or fire onValueChange. Native
// SelectionGained still drives inline items with no active FocusScope.

import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const focusNodeOptions: Array<{ onFocusChange?: (focused: boolean, source: string) => void }> = [];
let nativeSelectionChange = true;

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const react = await import("react");

  function Slot(props: { children?: React.ReactNode } & Record<string, unknown>) {
    const { children, ...slotProps } = props;
    if (!react.default.isValidElement(children)) {
      return null;
    }
    return react.default.cloneElement(children, { ...(children.props as Record<string, unknown>), ...slotProps });
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
  isNativeSelectionChange: () => nativeSelectionChange,
  useFocusNode: (options) => {
    focusNodeOptions.push(options);
    return { current: undefined };
  },
}));

vi.mock("../../../packages/react/tabs/src/Tabs/internals/ids", () => ({
  createTabsTriggerName: (value: string) => `TabsTrigger:${value}`,
}));

import { RadioGroupContextProvider } from "../../../packages/react/radio-group/src/RadioGroup/context";
import { RadioGroupItem } from "../../../packages/react/radio-group/src/RadioGroup/RadioGroupItem";
import { TabsContextProvider } from "../../../packages/react/tabs/src/Tabs/context";
import { TabsTrigger } from "../../../packages/react/tabs/src/Tabs/TabsTrigger";

afterEach(() => {
  cleanup();
  focusNodeOptions.splice(0);
  nativeSelectionChange = true;
});

function captureChildProps() {
  let received: Record<string, unknown> | undefined;
  const Probe = React.forwardRef<unknown, Record<string, unknown>>((props, _ref) => {
    received = props;
    return null;
  });
  return { Probe, getProps: () => received ?? {} };
}

const cases = [
  {
    name: "Tabs.Trigger",
    renderItem: (setValue: () => void, child: React.ReactElement) =>
      render(
        React.createElement(
          TabsContextProvider,
          {
            value: {
              value: "b",
              orientation: "horizontal",
              setValue,
              registerTrigger: () => () => {},
              moveSelection: vi.fn(),
            },
          },
          React.createElement(TabsTrigger, { value: "a", asChild: true }, child),
        ),
      ),
  },
  {
    name: "RadioGroup.Item",
    renderItem: (setValue: () => void, child: React.ReactElement) =>
      render(
        React.createElement(
          RadioGroupContextProvider,
          {
            value: {
              value: "b",
              setValue,
              disabled: false,
              required: false,
              orientation: "vertical",
              registerItem: () => () => {},
              moveSelection: vi.fn(),
            },
          },
          React.createElement(RadioGroupItem, { value: "a", asChild: true }, child),
        ),
      ),
  },
];

describe.each(cases)("$name selection follows focus", ({ renderItem }) => {
  it("ignores programmatic focus such as a trapped scope's fallback", () => {
    const setValue = vi.fn();
    const { Probe } = captureChildProps();
    renderItem(setValue, React.createElement(Probe));

    act(() => {
      focusNodeOptions.at(-1)?.onFocusChange?.(true, "programmatic");
    });

    expect(setValue).not.toHaveBeenCalled();
  });

  it("selects when the user's navigation moves focus onto it", () => {
    const setValue = vi.fn();
    const { Probe } = captureChildProps();
    renderItem(setValue, React.createElement(Probe));

    act(() => {
      focusNodeOptions.at(-1)?.onFocusChange?.(false, "navigation");
    });
    expect(setValue).not.toHaveBeenCalled();

    act(() => {
      focusNodeOptions.at(-1)?.onFocusChange?.(true, "navigation");
    });
    expect(setValue).toHaveBeenCalledWith("a");
  });

  it("follows native SelectionGained only when it is a native selection change", () => {
    const setValue = vi.fn();
    const { Probe, getProps } = captureChildProps();
    renderItem(setValue, React.createElement(Probe));
    const events = getProps().Event as { SelectionGained: () => void };

    nativeSelectionChange = false;
    act(() => {
      events.SelectionGained();
    });
    expect(setValue).not.toHaveBeenCalled();

    nativeSelectionChange = true;
    act(() => {
      events.SelectionGained();
    });
    expect(setValue).toHaveBeenCalledWith("a");
  });
});
