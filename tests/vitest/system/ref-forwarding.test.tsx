// @vitest-environment jsdom

// Style and system layout components forward `ref` to the instance they
// render, so they can serve as popper anchors, focus targets or be measured.
// Vitest runs React 19, which hands `ref` to function components as a plain
// prop; the Roblox runtime is @rbxts/react 17, which strips it. So the test
// also pins the forwardRef wrapper that makes forwarding work under 17.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const react = await import("react");
  const runtimeRefs = await import("../../../packages/react/runtime/src/refs");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  const controllable = await import("../../../packages/react/runtime/src/useControllableState");
  return {
    React: react.default,
    composeRefs: runtimeRefs.composeRefs,
    createStrictContext: strictContext.createStrictContext,
    useControllableState: controllable.useControllableState,
    Slot: () => null,
  };
});

// Theme tokens read Roblox enums at module load.
vi.hoisted(() => {
  const enums = (globalThis as unknown as { Enum: Record<string, Record<string, string>> }).Enum;
  enums.Font = { ...(enums.Font ?? {}), Gotham: "Gotham", GothamBold: "GothamBold", GothamMedium: "GothamMedium" };
  enums.AutomaticSize = { ...(enums.AutomaticSize ?? {}), None: "None", X: "X", Y: "Y", XY: "XY" };
  enums.FillDirection = { Vertical: "Vertical", Horizontal: "Horizontal" };
  enums.HorizontalAlignment = { Left: "Left", Center: "Center", Right: "Right" };
  enums.VerticalAlignment = { Top: "Top", Center: "Center", Bottom: "Bottom" };
  enums.SortOrder = { LayoutOrder: "LayoutOrder" };
});

import { Box } from "../../../packages/react/style/src/primitives/Box";
import { ThemeProvider } from "../../../packages/react/style/src/theme/ThemeProvider";
import { defaultLightTheme } from "../../../packages/react/style/src/theme/tokens";
import { Text } from "../../../packages/react/style/src/primitives/Text";
import { Row } from "../../../packages/react/system/src/layout/Row";
import { Stack } from "../../../packages/react/system/src/layout/Stack";
import { Surface } from "../../../packages/react/system/src/surface/surfacePrimitive";

afterEach(() => {
  cleanup();
});

describe.each([
  { name: "Box", Component: Box },
  { name: "Text", Component: Text },
  { name: "Stack", Component: Stack },
  { name: "Row", Component: Row },
  { name: "Surface", Component: Surface },
])("$name", ({ Component }) => {
  it("is a forwardRef component", () => {
    expect((Component as unknown as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for("react.forward_ref"));
  });

  it("forwards ref to its rendered instance", () => {
    const ref = React.createRef<unknown>();
    render(
      React.createElement(
        ThemeProvider,
        { defaultTheme: defaultLightTheme },
        React.createElement(Component as React.ComponentType<Record<string, unknown>>, { ref }),
      ),
    );
    expect(ref.current).toBeDefined();
    expect(ref.current).not.toBeNull();
  });
});
