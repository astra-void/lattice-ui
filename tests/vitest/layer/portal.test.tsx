// @vitest-environment jsdom

// Portal targets `props.container` first and falls back to the PortalProvider
// container. An explicit container must work without a PortalProvider; with
// neither, Portal keeps the strict context error.

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const portalTargets: unknown[] = [];

vi.mock("@lattice-ui/react-runtime", async () => {
  const react = await import("react");
  return {
    React: react.default,
    ReactRoblox: {
      createPortal: (children: React.ReactNode, target: unknown) => {
        portalTargets.push(target);
        return react.default.createElement(react.default.Fragment, {}, children);
      },
    },
  };
});

import { Portal } from "../../../packages/react/layer/src/portal/Portal";
import { PortalProvider } from "../../../packages/react/layer/src/portal/PortalProvider";

afterEach(() => {
  cleanup();
  portalTargets.splice(0);
});

describe("Portal container", () => {
  it("renders into an explicit container without a PortalProvider", () => {
    const container = { Name: "ExplicitContainer" };

    const view = render(
      React.createElement(Portal, { container: container as never }, React.createElement("frame", { "data-testid": "child" })),
    );

    expect(portalTargets.at(-1)).toBe(container);
    expect(view.getByTestId("child")).toBeDefined();
  });

  it("prefers the explicit container over the provider's", () => {
    const providerContainer = { Name: "PlayerGui" };
    const container = { Name: "ExplicitContainer" };

    render(
      React.createElement(
        PortalProvider,
        { container: providerContainer as never },
        React.createElement(Portal, { container: container as never }),
      ),
    );

    expect(portalTargets.at(-1)).toBe(container);
  });

  it("falls back to the provider's container", () => {
    const providerContainer = { Name: "PlayerGui" };

    render(React.createElement(PortalProvider, { container: providerContainer as never }, React.createElement(Portal)));

    expect(portalTargets.at(-1)).toBe(providerContainer);
  });

  it("keeps the strict error when there is neither a container nor a provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(React.createElement(Portal))).toThrow(/PortalProvider/);

    consoleError.mockRestore();
  });
});
