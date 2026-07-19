import { React, Slot } from "@lattice-ui/core";
import { mergeGuiProps } from "../sx/mergeGuiProps";
import type { Sx } from "../sx/sx";
import { resolveSx } from "../sx/sx";
import { useTheme } from "../theme/ThemeProvider";

type StyleProps = React.Attributes & Record<string, unknown>;

export type TextProps = {
  asChild?: boolean;
  sx?: Sx<StyleProps>;
  /**
   * Opt-in single-line overflow handling. When `true`, text that does not fit
   * the label's width is clipped with a trailing ellipsis (`TextTruncate.AtEnd`).
   * An explicit `TextTruncate` prop still wins over this shorthand.
   */
  truncate?: boolean;
  children?: React.ReactNode;
} & StyleProps;

export function Text(props: TextProps) {
  const asChild = props.asChild;
  const sx = props.sx;
  const truncate = props.truncate;
  const children = props.children;
  const restProps: StyleProps = {};
  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (rawKey === "asChild" || rawKey === "sx" || rawKey === "truncate" || rawKey === "children") {
      continue;
    }

    restProps[rawKey] = value;
  }

  const { theme } = useTheme();
  // `truncate` is a shorthand default; explicit props/sx still override it.
  const baseProps: StyleProps = truncate === true ? { TextTruncate: Enum.TextTruncate.AtEnd } : {};
  const mergedProps = mergeGuiProps(baseProps, restProps, resolveSx(sx, theme));

  if (asChild) {
    if (!React.isValidElement(children)) {
      error("[Text] `asChild` requires a single child element.");
    }

    return <Slot {...mergedProps}>{children}</Slot>;
  }

  return React.createElement("textlabel", mergedProps as never, children);
}
