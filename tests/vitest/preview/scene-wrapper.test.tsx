import * as React from "react";

import { beforeAll, describe, expect, it, vi } from "vitest";

type PreviewModule = {
  preview: {
    render: unknown;
    title: string;
    entry?: unknown;
  };
};

type SceneModule = {
  AccordionBasicScene?: () => unknown;
  DialogModalBlockScene?: () => unknown;
  RadioGroupDisabledScene?: () => unknown;
  ScrollAreaBasicScene?: () => unknown;
};

beforeAll(() => {
  (globalThis as Record<string, unknown>).Enum = {
    EasingDirection: {
      In: "In",
      Out: "Out",
    },
    EasingStyle: {
      Quad: "Quad",
    },
    TextTruncate: {
      AtEnd: "AtEnd",
    },
    TextXAlignment: {
      Left: "Left",
    },
    TextYAlignment: {
      Top: "Top",
    },
  };
  (globalThis as Record<string, unknown>).TweenInfo = class TweenInfo {
    constructor(
      public readonly Time: number,
      public readonly EasingStyle: string,
      public readonly EasingDirection: string,
    ) {}
  } as unknown as typeof TweenInfo;
  (globalThis as Record<string, unknown>).UDim2 = {
    fromOffset(x: number, y: number) {
      return { X: { Scale: 0, Offset: x }, Y: { Scale: 0, Offset: y } };
    },
    fromScale(x: number, y: number) {
      return { X: { Scale: x, Offset: 0 }, Y: { Scale: y, Offset: 0 } };
    },
  };
  (globalThis as Record<string, unknown>).UDim = class UDim {
    constructor(
      public readonly Scale: number,
      public readonly Offset: number,
    ) {}
  } as unknown as typeof UDim;
  (globalThis as Record<string, unknown>).Vector2 = class Vector2 {
    constructor(
      public readonly X: number,
      public readonly Y: number,
    ) {}
  } as unknown as typeof Vector2;
  (globalThis as Record<string, unknown>).Color3 = {
    fromRGB() {
      return {};
    },
  };
});

const sceneModulePaths = vi.hoisted(() => ({
  accordion: new URL("../../../apps/playground/src/client/scenes/AccordionBasicScene.tsx", import.meta.url).pathname,
  dialogModalBlock: new URL("../../../apps/playground/src/client/scenes/DialogModalBlockScene.tsx", import.meta.url)
    .pathname,
  radioGroupDisabled: new URL("../../../apps/playground/src/client/scenes/RadioGroupDisabledScene.tsx", import.meta.url)
    .pathname,
  scrollAreaBasic: new URL("../../../apps/playground/src/client/scenes/ScrollAreaBasicScene.tsx", import.meta.url)
    .pathname,
  previewTargetShell: new URL("../../../apps/loom-preview/src/preview-targets/PreviewTargetShell.tsx", import.meta.url)
    .pathname,
}));

const AccordionBasicScene = () => null;
const DialogModalBlockScene = () => null;
const RadioGroupDisabledScene = () => null;
const ScrollAreaBasicScene = () => null;

vi.mock("@lattice-ui/core", () => ({
  React,
}));

vi.mock(sceneModulePaths.previewTargetShell, () => ({
  PreviewTargetShell: (props: { children?: React.ReactNode }) => props.children,
}));

vi.mock(sceneModulePaths.accordion, () => ({
  AccordionBasicScene,
}));

vi.mock(sceneModulePaths.dialogModalBlock, () => ({
  DialogModalBlockScene,
}));

vi.mock(sceneModulePaths.radioGroupDisabled, () => ({
  RadioGroupDisabledScene,
}));

vi.mock(sceneModulePaths.scrollAreaBasic, () => ({
  ScrollAreaBasicScene,
}));

async function loadPreviewModule(path: string) {
  return (await import(path)) as PreviewModule & SceneModule;
}

function assertPreviewRenderContract(
  module: PreviewModule & SceneModule,
  sceneExportName: keyof SceneModule,
  title: string,
) {
  const sceneComponent = module[sceneExportName];
  if (typeof sceneComponent !== "function") {
    throw new Error(`Expected ${String(sceneExportName)} to be exported as a function.`);
  }

  expect(module.preview.title).toBe(title);
  expect(typeof module.preview.render).toBe("function");
  expect("entry" in module.preview).toBe(false);

  const element = (module.preview.render as () => React.ReactElement)();
  expect(element).toBeDefined();
}

describe("loom preview scene wrappers", () => {
  it("exports render-based contracts for the reported scenes", async () => {
    const accordion = await loadPreviewModule(
      "../../../apps/loom-preview/src/preview-targets/AccordionBasicScene.loom",
    );
    const dialog = await loadPreviewModule("../../../apps/loom-preview/src/preview-targets/DialogModalBlockScene.loom");
    const radio = await loadPreviewModule(
      "../../../apps/loom-preview/src/preview-targets/RadioGroupDisabledScene.loom",
    );
    const scroll = await loadPreviewModule("../../../apps/loom-preview/src/preview-targets/ScrollAreaBasicScene.loom");

    assertPreviewRenderContract(accordion, "AccordionBasicScene", "Accordion Basic");
    assertPreviewRenderContract(dialog, "DialogModalBlockScene", "Dialog Modal Block");
    assertPreviewRenderContract(radio, "RadioGroupDisabledScene", "Radio Group Disabled");
    assertPreviewRenderContract(scroll, "ScrollAreaBasicScene", "Scroll Area Basic");
  });
});
