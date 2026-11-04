// @ts-nocheck
// @vitest-environment jsdom

// Inside SystemProvider the style ThemeProvider is controlled by the
// density-resolved theme. `useTheme().setTheme` must still land somewhere:
// it writes the base theme, and density is applied on top of it.

import { act, cleanup, render } from "@testing-library/react";
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
  const enums = globalThis.Enum;
  enums.Font = { ...(enums.Font ?? {}), Gotham: "Gotham", GothamBold: "GothamBold", GothamMedium: "GothamMedium" };
});

import { useTheme } from "../../../packages/react/style/src/theme/ThemeProvider";
import { defaultLightTheme } from "../../../packages/react/style/src/theme/tokens";
import { SystemProvider, useSystemTheme } from "../../../packages/react/system/src/system/SystemProvider";

afterEach(() => {
  cleanup();
});

const nextBaseTheme = {
  ...defaultLightTheme,
  typography: {
    ...defaultLightTheme.typography,
    bodyMd: { font: defaultLightTheme.typography.bodyMd.font, textSize: 30 },
  },
};

function renderWithProbe(providerProps: Record<string, unknown>) {
  const probe: { style?: ReturnType<typeof useTheme>; system?: ReturnType<typeof useSystemTheme> } = {};
  function Probe() {
    probe.style = useTheme();
    probe.system = useSystemTheme();
    return null;
  }

  const result = render(React.createElement(SystemProvider, providerProps, React.createElement(Probe)));
  return { probe, result };
}

describe("useTheme().setTheme inside SystemProvider", () => {
  it("updates the base theme and re-applies density", () => {
    const { probe } = renderWithProbe({ defaultDensity: "compact" });

    act(() => {
      probe.style.setTheme(nextBaseTheme);
    });

    expect(probe.system.baseTheme).toBe(nextBaseTheme);
    // compact scales typography by 0.92 once: round(30 * 0.92) = 28.
    expect(probe.system.theme.typography.bodyMd.textSize).toBe(28);
    expect(probe.style.theme).toBe(probe.system.theme);
  });

  it("reports the write through onThemeChange when the theme is controlled", () => {
    const onThemeChange = vi.fn();
    const { probe } = renderWithProbe({ theme: defaultLightTheme, onThemeChange });

    act(() => {
      probe.style.setTheme(nextBaseTheme);
    });

    expect(onThemeChange).toHaveBeenCalledTimes(1);
    expect(onThemeChange).toHaveBeenCalledWith(nextBaseTheme);
    // Controlled and the parent did not accept it, so the base theme holds.
    expect(probe.system.baseTheme).toBe(defaultLightTheme);
  });
});
