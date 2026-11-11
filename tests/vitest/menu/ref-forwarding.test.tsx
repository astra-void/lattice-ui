// @vitest-environment jsdom

// Parts forward a consumer `ref` to the instance they render (DEV-97). @rbxts/react
// 17 strips `ref` from function component props, so the only way in is
// React.forwardRef; `getPassthroughProps` restores it as `passthrough.ref`, and a
// part that owns an internal ref must compose the consumer's with it instead of
// replacing it. Vitest runs React 19, so the forwardRef wrapper is pinned
// explicitly as well.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as Record<string, unknown>).Enum = {
  ...((globalThis as Record<string, unknown>).Enum as Record<string, unknown>),
  AutomaticSize: { XY: "XY" },
};

vi.mock("@lattice-ui/react-runtime", async () => {
  const runtimeProps = await import("../../../packages/react/runtime/src/props");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const runtimeSlot = await import("../../../packages/react/runtime/src/slot");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const react = await import("react");

  return {
    composeEvents: runtimeProps.composeEvents,
    getPassthroughProps: runtimeProps.getPassthroughProps,
    toSlotProps: runtimeProps.toSlotProps,
    composeRefs: runtimeRefs.composeRefs,
    getElementRef: runtimeRefs.getElementRef,
    mergeSlotModifiers: runtimeSlot.mergeSlotModifiers,
    resolveSlotChildren: runtimeSlot.resolveSlotChildren,
    toCloneElementProps: runtimeSlot.toCloneElementProps,
    Slot: runtimeSlot.Slot,
    React: react.default,
    createStrictContext: strictContext.createStrictContext,
  };
});

vi.mock("@lattice-ui/react-focus", async () => {
  const guard = await import("../../../packages/react/focus/src/useActivationGuard");
  const react = await import("react");
  return {
    FocusScope: ({ children }: { children?: React.ReactNode }) =>
      react.default.createElement(react.default.Fragment, null, children),
    focusGuiObject: () => undefined,
    useActivationGuard: guard.useActivationGuard,
    useFocusNode: () => ({ current: undefined }),
  };
});

vi.mock("@lattice-ui/react-layer", async () => {
  const react = await import("react");
  return {
    DismissableLayer: (props: { children?: React.ReactNode }) =>
      react.default.createElement(react.default.Fragment, null, props.children),
    Presence: (props: {
      present: boolean;
      render: (state: { isPresent: boolean; onExitComplete: () => void }) => React.ReactElement | null;
    }) => props.render({ isPresent: props.present, onExitComplete: () => undefined }),
  };
});

vi.mock("@lattice-ui/react-motion", () => ({
  usePresenceMotionController: () => ({
    ref: { current: undefined },
    phase: "visible",
    present: true,
    mounted: true,
  }),
}));

vi.mock("@lattice-ui/react-popper", () => ({
  usePopper: () => ({
    anchorPoint: new Vector2(0, 0),
    contentSize: new Vector2(0, 0),
    placement: "bottom",
    position: UDim2.fromOffset(0, 0),
    isPositioned: true,
    update: () => undefined,
  }),
}));

import { getPassthroughProps } from "../../../packages/react/runtime/src/props";
import { MenuContextProvider } from "../../../packages/react/menu/src/Menu/context";
import { MenuContent } from "../../../packages/react/menu/src/Menu/MenuContent";
import { MenuGroup } from "../../../packages/react/menu/src/Menu/MenuGroup";
import { MenuItem } from "../../../packages/react/menu/src/Menu/MenuItem";
import { MenuLabel } from "../../../packages/react/menu/src/Menu/MenuLabel";
import { MenuSeparator } from "../../../packages/react/menu/src/Menu/MenuSeparator";
import { MenuTrigger } from "../../../packages/react/menu/src/Menu/MenuTrigger";
import type { MenuContextValue } from "../../../packages/react/menu/src/Menu/types";

(HTMLElement.prototype as unknown as Record<string, unknown>).IsA = (className: string) => className === "GuiObject";

afterEach(() => {
  cleanup();
});

function createMenuContext() {
  return {
    open: true,
    setOpen: () => {},
    modal: true,
    triggerRef: { current: undefined },
    contentRef: { current: undefined },
    registerItem: () => () => {},
    focusFirstItem: () => {},
    restoreTriggerFocus: () => {},
  } as unknown as MenuContextValue;
}

function renderInMenu(element: React.ReactElement, menuContext = createMenuContext()) {
  // The parts render Roblox instance props onto jsdom elements; React's unknown-prop
  // warnings are expected noise here.
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(React.createElement(MenuContextProvider, { value: menuContext }, element));
  consoleError.mockRestore();
  return menuContext;
}

describe("getPassthroughProps", () => {
  it("restores a forwarded ref as passthrough.ref", () => {
    const ref = React.createRef<Frame>();
    const passthrough = getPassthroughProps<Frame>({ asChild: true, Visible: false }, ["asChild"], ref as never);
    expect(passthrough.ref).toBe(ref);
    expect((passthrough as Record<string, unknown>).Visible).toBe(false);
  });

  it("leaves ref unset when nothing was forwarded", () => {
    expect("ref" in getPassthroughProps<Frame>({}, [], null)).toBe(false);
    expect("ref" in getPassthroughProps<Frame>({}, [], undefined)).toBe(false);
  });
});

describe.each([
  { name: "MenuGroup", Component: MenuGroup },
  { name: "MenuLabel", Component: MenuLabel },
  { name: "MenuSeparator", Component: MenuSeparator },
  { name: "MenuItem", Component: MenuItem },
  { name: "MenuTrigger", Component: MenuTrigger },
  { name: "MenuContent", Component: MenuContent },
])("$name", ({ Component }) => {
  it("is a forwardRef component", () => {
    expect((Component as unknown as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for("react.forward_ref"));
  });

  it("forwards ref to its rendered instance", () => {
    const ref = React.createRef<unknown>();
    renderInMenu(React.createElement(Component as React.ComponentType<Record<string, unknown>>, { ref }));
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});

describe("internal refs are composed with the consumer ref, not replaced", () => {
  it("MenuContent keeps writing its content ref", () => {
    const ref = React.createRef<unknown>();
    const menuContext = renderInMenu(React.createElement(MenuContent, { ref } as never));
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(menuContext.contentRef.current).toBe(ref.current);
  });

  it("MenuContent asChild forwards the ref to the consumer's element", () => {
    const ref = React.createRef<unknown>();
    renderInMenu(
      React.createElement(MenuContent, { asChild: true, ref } as never, React.createElement("frame", { id: "own" })),
    );
    expect((ref.current as HTMLElement | null)?.id).toBe("own");
  });

  it("MenuTrigger keeps writing its trigger ref", () => {
    const ref = React.createRef<unknown>();
    const menuContext = renderInMenu(React.createElement(MenuTrigger, { ref } as never));
    expect(menuContext.triggerRef.current).toBe(ref.current);
  });
});
