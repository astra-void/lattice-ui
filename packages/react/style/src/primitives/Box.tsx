import { React, Slot } from "@lattice-ui/react-runtime";
import { mergeGuiProps } from "../sx/mergeGuiProps";
import type { Sx } from "../sx/sx";
import { resolveSx } from "../sx/sx";
import { useTheme } from "../theme/ThemeProvider";

type StyleProps = React.Attributes & Record<string, unknown>;

export type BoxProps = {
  asChild?: boolean;
  /**
   * Theme-aware style props. Direct props win over `sx` when both set the same
   * property; `Event`/`Change` handlers from both are composed (`sx` first).
   */
  sx?: Sx<StyleProps>;
  children?: React.ReactNode;
} & StyleProps;

export const Box = React.forwardRef<Instance, BoxProps>((props, ref) => {
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
  // Direct props win over `sx`, matching the system layout primitives.
  const mergedProps = mergeGuiProps(resolveSx(sx, theme), restProps);

  if (asChild) {
    if (!React.isValidElement(children)) {
      error("[Box] `asChild` requires a single child element.");
    }

    return (
      <Slot {...mergedProps} ref={ref}>
        {children}
      </Slot>
    );
  }

  return React.createElement("frame", { ...mergedProps, ref } as never, children);
});
Box.displayName = "Box";
