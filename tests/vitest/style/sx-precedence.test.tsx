// @ts-nocheck
// @vitest-environment jsdom

// Style and system components share one precedence: component defaults, then
// `sx`, then direct props. A direct prop wins over `sx` for the same key.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

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

// Theme tokens and layout components read Roblox enums.
vi.hoisted(() => {
  const enums = globalThis.Enum;
  enums.Font = { ...(enums.Font ?? {}), Gotham: "Gotham", GothamBold: "GothamBold", GothamMedium: "GothamMedium" };
  enums.AutomaticSize = { ...(enums.AutomaticSize ?? {}), None: "None", X: "X", Y: "Y", XY: "XY" };
  enums.FillDirection = { Vertical: "Vertical", Horizontal: "Horizontal" };
  enums.HorizontalAlignment = { Left: "Left", Center: "Center", Right: "Right" };
  enums.VerticalAlignment = { Top: "Top", Center: "Center", Bottom: "Bottom" };
  enums.SortOrder = { LayoutOrder: "LayoutOrder" };
  enums.TextTruncate = { None: "None", AtEnd: "AtEnd" };
});

import { Box } from "../../../packages/react/style/src/primitives/Box";
import { Text } from "../../../packages/react/style/src/primitives/Text";
import { ThemeProvider } from "../../../packages/react/style/src/theme/ThemeProvider";
import { defaultLightTheme } from "../../../packages/react/style/src/theme/tokens";
import { Grid } from "../../../packages/react/system/src/layout/Grid";
import { Row } from "../../../packages/react/system/src/layout/Row";
import { Stack } from "../../../packages/react/system/src/layout/Stack";
import { Surface } from "../../../packages/react/system/src/surface/surfacePrimitive";

// Grid only measures Roblox frames; let the DOM nodes it gets fail the check.
const elementProto = Element.prototype as unknown as { IsA?: () => boolean };
beforeAll(() => {
  elementProto.IsA = () => false;
});
afterAll(() => {
  delete elementProto.IsA;
});

afterEach(() => {
  cleanup();
});

function renderHost(Component: React.ComponentType<Record<string, unknown>>, props: Record<string, unknown>) {
  const { container } = render(
    React.createElement(ThemeProvider, { defaultTheme: defaultLightTheme }, React.createElement(Component, props)),
  );
  return container.firstElementChild as Element;
}

describe.each([
  { name: "Box", Component: Box },
  { name: "Text", Component: Text },
  { name: "Stack", Component: Stack },
  { name: "Row", Component: Row },
  { name: "Grid", Component: Grid },
  { name: "Surface", Component: Surface },
])("$name", ({ Component }) => {
  it("lets a direct prop win over sx", () => {
    const host = renderHost(Component, { Name: "direct", sx: { Name: "sx" } });
    expect(host.getAttribute("Name")).toBe("direct");
  });

  it("applies sx when no direct prop sets the key", () => {
    const host = renderHost(Component, { sx: { Name: "sx" } });
    expect(host.getAttribute("Name")).toBe("sx");
  });

  it("resolves a theme function sx under a direct prop", () => {
    const host = renderHost(Component, { Name: "direct", sx: () => ({ Name: "sx", LayoutOrder: 3 }) });
    expect(host.getAttribute("Name")).toBe("direct");
    expect(host.getAttribute("LayoutOrder")).toBe("3");
  });
});

describe("Text truncate", () => {
  it("is overridden by sx, and sx by a direct TextTruncate", () => {
    expect(renderHost(Text, { truncate: true }).getAttribute("TextTruncate")).toBe("AtEnd");
    expect(renderHost(Text, { truncate: true, sx: { TextTruncate: "None" } }).getAttribute("TextTruncate")).toBe(
      "None",
    );
    expect(
      renderHost(Text, { truncate: true, sx: { TextTruncate: "None" }, TextTruncate: "AtEnd" }).getAttribute(
        "TextTruncate",
      ),
    ).toBe("AtEnd");
  });
});
