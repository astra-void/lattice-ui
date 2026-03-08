import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPreviewModules } from "../../../packages/preview/src/compiler/buildPreviewTargets";
import { transformPreviewSource } from "../../../packages/preview/src/compiler/transformSource";

describe("preview source transform", () => {
  it("rewrites supported imports, enums, host elements, and DOM-facing types", () => {
    const source = `
      import { React, Slot } from "@lattice-ui/core";
      import type { LayerInteractEvent } from "@lattice-ui/layer";
      import type ReactTypes from "@rbxts/react";

      type Props = {
        triggerRef: ReactTypes.MutableRefObject<GuiObject | undefined>;
        container?: BasePlayerGui;
        event?: LayerInteractEvent;
      };

      export function Example(props: Props) {
        const ref = React.useRef<TextLabel>();
        return (
          <textlabel
            Text="Preview"
            TextXAlignment={Enum.TextXAlignment.Left}
            ref={ref}
          >
            <uipadding PaddingLeft={new UDim(0, 10)} />
            <uiscale Scale={1.25} />
          </textlabel>
        );
      }
    `;

    const result = transformPreviewSource(source, {
      filePath: "/virtual/example.tsx",
      runtimeModule: "@lattice-ui/preview/runtime",
      target: "rich-hosts",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.code).toContain('from "@lattice-ui/preview/runtime"');
    expect(result.code).toContain('from "react"');
    expect(result.code).toContain("MutableRefObject<(HTMLElement | null) | undefined>");
    expect(result.code).toContain("container?: HTMLElement | null");
    expect(result.code).toContain("<TextLabel");
    expect(result.code).toContain("<UIPadding");
    expect(result.code).toContain("<UIScale");
    expect(result.code).toContain('"left"');
  });

  it("keeps unresolved Enum access for the browser runtime mock", () => {
    const source = `
      export const inputMode = Enum.UserInputType.MouseButton1;
      export const host = <frame />;
    `;

    const result = transformPreviewSource(source, {
      filePath: "/virtual/enum-passthrough.tsx",
      runtimeModule: "@lattice-ui/preview/runtime",
      target: "enum-passthrough",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.code).toContain("Enum.UserInputType.MouseButton1");
    expect(result.code).toContain("<Frame");
  });

  it("merges rewritten runtime imports without duplicate bindings", () => {
    const source = `
      import { React, Slot } from "@lattice-ui/core";
      import { FocusScope } from "@lattice-ui/focus";
      import type { LayerInteractEvent } from "@lattice-ui/layer";

      export function Example(props: { event?: LayerInteractEvent }) {
        return (
          <frame>
            <Slot>{props.event ? <textlabel Text="ready" /> : undefined}</Slot>
            <FocusScope active={true}>{React.createElement("div")}</FocusScope>
          </frame>
        );
      }
    `;

    const result = transformPreviewSource(source, {
      filePath: "/virtual/merged-imports.tsx",
      runtimeModule: "@lattice-ui/preview/runtime",
      target: "merged-imports",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.code.match(/from "@lattice-ui\/preview\/runtime"/g) ?? []).toHaveLength(1);
    expect(result.code).toContain("React");
    expect(result.code).toContain("Slot");
    expect(result.code).toContain("FocusScope");
    expect(result.code).toContain("LayerInteractEvent");
  });

  it("passes Roblox globals through to the runtime fallback and still reports unsupported host elements", () => {
    const source = `
      export const value = game.GetService("Players");
      export const tween = new TweenInfo(0.1);
      export const host = <viewportframe />;
    `;

    const result = transformPreviewSource(source, {
      filePath: "/virtual/bad.tsx",
      runtimeModule: "@lattice-ui/preview/runtime",
      target: "broken",
    });

    expect(result.errors.map((item) => item.code)).toEqual(["UNSUPPORTED_HOST_ELEMENT"]);
    expect(result.code).toContain('__previewGlobal("game")');
    expect(result.code).toContain('__previewGlobal("TweenInfo")');
  });
});

describe("buildPreviewModules", () => {
  it("writes generated sources for arbitrary targets", async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-preview-"));

    const result = await buildPreviewModules({
      targets: [
        {
          name: "rich-hosts",
          sourceRoot: path.resolve(__dirname, "fixtures/rich-hosts/src"),
        },
      ],
      outDir,
    });

    expect(result.writtenFiles.some((filePath) => filePath.endsWith("rich-hosts/index.tsx"))).toBe(true);
    const generatedIndex = path.join(outDir, "rich-hosts/index.tsx");
    expect(fs.existsSync(generatedIndex)).toBe(true);
    expect(fs.readFileSync(generatedIndex, "utf8")).toContain("Generated by @lattice-ui/preview");
  });
});

