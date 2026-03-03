import { React } from "@lattice-ui/core";
import { mergeGuiProps, resolveSx, useTheme } from "@lattice-ui/style";
import type { Sx } from "@lattice-ui/style";
import { surface } from "./surface";
import type { SurfaceToken } from "./surface";

type StyleProps = React.Attributes & Record<string, unknown>;

export type SurfaceProps = {
  tone?: SurfaceToken;
  sx?: Sx<StyleProps>;
  children?: React.ReactNode;
} & StyleProps;

/**
 * Surface M2: frame-hosted primitive with fixed token-driven decoration.
 * `asChild` is intentionally not supported in this milestone.
 */
export function Surface(props: SurfaceProps) {
  const tone = props.tone ?? "surface";
  const sx = props.sx;
  const children = props.children;

  const asChild = (props as { asChild?: unknown }).asChild;
  if (asChild !== undefined) {
    error("[Surface] `asChild` is not supported in M2.");
  }

  const restProps: StyleProps = {};
  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (rawKey === "tone" || rawKey === "sx" || rawKey === "children" || rawKey === "asChild") {
      continue;
    }

    restProps[rawKey] = value;
  }

  const { theme } = useTheme();
  const toneProps = resolveSx(surface<StyleProps>(tone), theme);
  const sxProps = resolveSx(sx, theme);
  const baseProps =
    tone === "overlay" ? toneProps : mergeGuiProps(toneProps, { BorderSizePixel: 0 } as Partial<StyleProps>);
  const mergedProps = mergeGuiProps(baseProps, sxProps, restProps);
  const decorated = tone !== "overlay";

  return (
    <frame {...(mergedProps as Record<string, unknown>)}>
      {decorated ? <uicorner CornerRadius={new UDim(0, theme.radius.lg)} /> : undefined}
      {decorated ? <uistroke Color={theme.colors.border} Thickness={1} /> : undefined}
      {children}
    </frame>
  );
}
