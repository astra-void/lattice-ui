import { React, Slot } from "@lattice-ui/core";
import { mergeGuiProps } from "../sx/mergeGuiProps";
import type { Sx } from "../sx/sx";
import { resolveSx } from "../sx/sx";
import { useTheme } from "../theme/ThemeProvider";

type StyleProps = React.Attributes & Record<string, unknown>;

export type BoxProps = {
  asChild?: boolean;
  sx?: Sx<StyleProps>;
  children?: React.ReactNode;
} & StyleProps;

export function Box(props: BoxProps) {
  const asChild = props.asChild;
  const sx = props.sx;
  const children = props.children;
  const restProps: StyleProps = {};
  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (rawKey === "asChild" || rawKey === "sx" || rawKey === "children") {
      continue;
    }

    restProps[rawKey] = value;
  }

  const { theme } = useTheme();
  const mergedProps = mergeGuiProps(restProps, resolveSx(sx, theme));

  if (asChild) {
    if (!React.isValidElement(children)) {
      error("[Box] `asChild` requires a single child element.");
    }

    return <Slot {...mergedProps}>{children}</Slot>;
  }

  return React.createElement("frame", mergedProps as never, children);
}
