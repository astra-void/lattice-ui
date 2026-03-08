import { compile_tsx, transformPreviewSource } from "@lattice-ui/compiler";
import { describe, expect, it } from "vitest";

describe("@lattice-ui/compiler preview transform", () => {
  it("returns preview transform results with rewritten runtime imports and DOM-facing types", () => {
    const source = `
      import { React, Slot } from "@lattice-ui/core";
      import type ReactTypes from "@rbxts/react";

      type Props = {
        triggerRef: ReactTypes.MutableRefObject<GuiObject | undefined>;
      };

      export function Example(props: Props) {
        const ref = React.useRef<TextLabel>();
        return <textlabel ref={ref}>{props.triggerRef.current}</textlabel>;
      }
    `;

    const result = transformPreviewSource(source, {
      filePath: "/virtual/compiler-transform.tsx",
      runtimeModule: "@lattice-ui/preview/runtime",
      target: "compiler-transform",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.code).toContain('from "@lattice-ui/preview/runtime"');
    expect(result.code).toContain('from "react"');
    expect(result.code).toContain("MutableRefObject<HTMLElement | null | undefined>");
    expect(result.code).toContain("<TextLabel");
  });

  it("keeps unsupported-host diagnostics while compile_tsx still produces the browser fallback host", () => {
    const transformed = transformPreviewSource(`export const host = <viewportframe BackgroundTransparency={1} />;`, {
      filePath: "/virtual/fallback.tsx",
      runtimeModule: "@lattice-ui/preview/runtime",
      target: "fallback",
    });

    expect(transformed.errors.map((item) => item.code)).toEqual(["UNSUPPORTED_HOST_ELEMENT"]);

    const compiled = compile_tsx(transformed.code);
    expect(compiled).toContain('data-rbx="viewportframe"');
    expect(compiled).toContain("__rbxStyle");
    expect(compiled).toContain("BackgroundTransparency: 1");
  });
});


