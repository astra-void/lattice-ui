// Tooltip and Toast export each part by name next to the namespace object, like
// Dialog, Popover, Menu and ContextMenu, so parts can be imported directly.

import { describe, expect, it, vi } from "vitest";

vi.mock("@lattice-ui/react-runtime", async () => {
  const react = await import("react");
  const strictContext = await import("../../../packages/react/runtime/src/context");
  return {
    React: react.default,
    createStrictContext: strictContext.createStrictContext,
  };
});
vi.mock("@lattice-ui/react-focus", () => ({}));
vi.mock("@lattice-ui/react-layer", () => ({}));
vi.mock("@lattice-ui/react-motion", () => ({}));
vi.mock("@lattice-ui/react-popper", () => ({}));

import * as toast from "../../../packages/react/toast/src";
import * as queue from "../../../packages/react/toast/src/Toast/queue";
import * as tooltip from "../../../packages/react/tooltip/src";

describe("overlay entrypoints export parts by name", () => {
  it("exports every Tooltip part by name", () => {
    for (const [part, component] of Object.entries(tooltip.Tooltip)) {
      expect((tooltip as Record<string, unknown>)[`Tooltip${part}`]).toBe(component);
    }
  });

  it("exports every Toast part by name", () => {
    for (const [part, component] of Object.entries(toast.Toast)) {
      expect((toast as Record<string, unknown>)[`Toast${part}`]).toBe(component);
    }
  });

  it("exports every Toast queue helper", () => {
    for (const [name, value] of Object.entries(queue)) {
      expect((toast as Record<string, unknown>)[name]).toBe(value);
    }
  });
});
