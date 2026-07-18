// @vitest-environment jsdom

// Regression test: Dialog.Overlay is portaled into BasePlayerGui by
// Dialog.Portal. A GuiObject parented directly to PlayerGui without a
// LayerCollector (ScreenGui) ancestor never renders in Roblox, so the overlay
// must host itself inside its own screengui.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/core", async () => {
  const react = await import("react");
  const controllable = await import("../../../packages/core/src/useControllableState");
  const strictContext = await import("../../../packages/core/src/context");

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
    React: react.default,
    Slot,
    useControllableState: controllable.useControllableState,
    createStrictContext: strictContext.createStrictContext,
  };
});

vi.mock("@lattice-ui/motion", () => ({
  createOverlayFadeRecipe: () => ({}),
  usePresenceMotionController: () => ({
    mounted: true,
    phase: "visible",
    present: true,
    ref: { current: undefined },
  }),
}));

vi.mock("@lattice-ui/layer", async () => {
  const react = await import("react");
  const presence = await import("../../../packages/layer/src/presence/Presence");

  return {
    Presence: presence.Presence,
    usePortalContext: () => ({ container: {}, displayOrderBase: 1000 }),
    Portal: (props: { children?: React.ReactNode }) => react.default.createElement(react.default.Fragment, {}, props.children),
  };
});

import { DialogOverlay } from "../../../packages/dialog/src/Dialog/DialogOverlay";
import { DialogContextProvider } from "../../../packages/dialog/src/Dialog/context";

afterEach(() => {
  cleanup();
});

function renderOverlay(overlayProps: Record<string, unknown> = {}) {
  return render(
    React.createElement(
      DialogContextProvider,
      {
        value: {
          open: true,
          setOpen: () => {},
        },
      },
      React.createElement(DialogOverlay, overlayProps),
    ),
  );
}

describe("DialogOverlay ScreenGui host", () => {
  it("wraps the overlay in its own screengui so it renders under PlayerGui", () => {
    const { container } = renderOverlay();

    const screenGui = container.querySelector("screengui");
    expect(screenGui).not.toBeNull();
    expect(screenGui!.querySelector("textbutton")).not.toBeNull();
  });

  it("keeps the overlay's DisplayOrder below every dismissable layer", () => {
    const { container } = renderOverlay();

    const screenGui = container.querySelector("screengui");
    // DismissableLayer renders at displayOrderBase + stackOrder with
    // stackOrder >= 1; the overlay must stay strictly below that.
    expect(Number(screenGui!.getAttribute("DisplayOrder"))).toBe(1000);
  });

  it("hosts asChild overlays in the screengui as well", () => {
    const { container } = renderOverlay({
      asChild: true,
      children: React.createElement("frame", { "data-testid": "custom-overlay" }),
    });

    const screenGui = container.querySelector("screengui");
    expect(screenGui).not.toBeNull();
    expect(screenGui!.querySelector("frame")).not.toBeNull();
  });
});
