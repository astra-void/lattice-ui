// @vitest-environment jsdom

// Tabs.Content names its panel after its value (pairing it with the trigger's
// Name) on both the default frame path and the asChild path.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const strictContext = await import("../../../packages/react/runtime/src/context");
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
    composeRefs: runtimeRefs.composeRefs,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    getSlotChild: runtimeSlot.getSlotChild,
    toSlotProps: runtimeProps.toSlotProps,
    createStrictContext: strictContext.createStrictContext,
    React: react.default,
    Slot,
  };
});

vi.mock("@lattice-ui/react-motion", () => ({
  usePresenceMotionController: () => ({
    mounted: true,
    phase: "visible",
    present: true,
    ref: { current: undefined },
  }),
}));

vi.mock("@lattice-ui/react-layer", async () => {
  const presence = await import("../../../packages/react/layer/src/presence/Presence");
  return { Presence: presence.Presence };
});

// The real helper sanitizes with Luau's string.gsub, which the shim does not provide.
vi.mock("../../../packages/react/tabs/src/Tabs/internals/ids", () => ({
  createTabsContentName: (value: string) => `TabsContent:${value}`,
  createTabsTriggerName: (value: string) => `TabsTrigger:${value}`,
}));

import { TabsContextProvider } from "../../../packages/react/tabs/src/Tabs/context";
import { TabsContent } from "../../../packages/react/tabs/src/Tabs/TabsContent";

afterEach(() => {
  cleanup();
});

function renderContent(contentProps: Record<string, unknown>) {
  return render(
    React.createElement(
      TabsContextProvider,
      { value: { value: "account", setValue: () => {}, orientation: "horizontal" } as never },
      React.createElement(TabsContent as React.ComponentType<Record<string, unknown>>, {
        value: "account",
        ...contentProps,
      }),
    ),
  );
}

describe("Tabs.Content Name", () => {
  it("names the default frame after its value", () => {
    const { container } = renderContent({});

    expect(container.querySelector("frame")?.getAttribute("Name")).toBe("TabsContent:account");
  });

  it("names the default frame with forceMount", () => {
    const { container } = renderContent({ forceMount: true });

    expect(container.querySelector("frame")?.getAttribute("Name")).toBe("TabsContent:account");
  });

  it("names the asChild child after its value", () => {
    const { container } = renderContent({
      asChild: true,
      children: React.createElement("scrollingframe"),
    });

    expect(container.querySelector("scrollingframe")?.getAttribute("Name")).toBe("TabsContent:account");
  });
});
