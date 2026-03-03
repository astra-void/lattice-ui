import { React } from "@lattice-ui/core";
import { mergeGuiProps, resolveSx, useTheme } from "@lattice-ui/style";
import { resolvePadding, resolveSpace } from "./space";
import type { LayoutDirection, StackAlign, StackAutoSize, StackJustify, StackProps } from "./types";

type StyleProps = React.Attributes & Record<string, unknown>;

function toHorizontalAlignment(value: StackAlign | StackJustify) {
  switch (value) {
    case "center":
      return Enum.HorizontalAlignment.Center;
    case "end":
      return Enum.HorizontalAlignment.Right;
    case "start":
    default:
      return Enum.HorizontalAlignment.Left;
  }
}

function toVerticalAlignment(value: StackAlign | StackJustify) {
  switch (value) {
    case "center":
      return Enum.VerticalAlignment.Center;
    case "end":
      return Enum.VerticalAlignment.Bottom;
    case "start":
    default:
      return Enum.VerticalAlignment.Top;
  }
}

function toAutomaticSize(autoSize: StackAutoSize | undefined, direction: LayoutDirection) {
  if (autoSize === undefined || autoSize === false) {
    return Enum.AutomaticSize.None;
  }

  if (autoSize === true) {
    return direction === "vertical" ? Enum.AutomaticSize.Y : Enum.AutomaticSize.X;
  }

  switch (autoSize) {
    case "x":
      return Enum.AutomaticSize.X;
    case "y":
      return Enum.AutomaticSize.Y;
    case "xy":
      return Enum.AutomaticSize.XY;
    default:
      return Enum.AutomaticSize.None;
  }
}

export function Stack(props: StackProps) {
  const direction = props.direction ?? "vertical";
  const gap = props.gap ?? 0;
  const align = props.align ?? "start";
  const justify = props.justify ?? "start";
  const autoSize = props.autoSize;
  const sx = props.sx;
  const children = props.children;
  const asChild = (props as { asChild?: unknown }).asChild;

  if (asChild !== undefined) {
    error("[Stack] `asChild` is not supported in M3.");
  }

  const restProps: StyleProps = {};
  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (
      rawKey === "direction" ||
      rawKey === "gap" ||
      rawKey === "align" ||
      rawKey === "justify" ||
      rawKey === "autoSize" ||
      rawKey === "sx" ||
      rawKey === "asChild" ||
      rawKey === "padding" ||
      rawKey === "paddingX" ||
      rawKey === "paddingY" ||
      rawKey === "paddingTop" ||
      rawKey === "paddingRight" ||
      rawKey === "paddingBottom" ||
      rawKey === "paddingLeft" ||
      rawKey === "children"
    ) {
      continue;
    }

    restProps[rawKey] = value;
  }

  const { theme } = useTheme();
  const sxProps = resolveSx(sx, theme);
  const baseProps: Partial<StyleProps> = {
    BackgroundTransparency: 1,
    BorderSizePixel: 0,
    AutomaticSize: toAutomaticSize(autoSize, direction),
  };
  const mergedProps = mergeGuiProps(baseProps, sxProps, restProps);

  const resolvedGap = resolveSpace(theme, gap);
  const padding = resolvePadding(theme, props);
  const hasPadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;

  const vertical = direction === "vertical";
  const horizontalAlignment = vertical ? toHorizontalAlignment(align) : toHorizontalAlignment(justify);
  const verticalAlignment = vertical ? toVerticalAlignment(justify) : toVerticalAlignment(align);

  return (
    <frame {...(mergedProps as Record<string, unknown>)}>
      <uilistlayout
        FillDirection={vertical ? Enum.FillDirection.Vertical : Enum.FillDirection.Horizontal}
        HorizontalAlignment={horizontalAlignment}
        Padding={new UDim(0, resolvedGap)}
        SortOrder={Enum.SortOrder.LayoutOrder}
        VerticalAlignment={verticalAlignment}
      />
      {hasPadding ? (
        <uipadding
          PaddingBottom={new UDim(0, padding.bottom)}
          PaddingLeft={new UDim(0, padding.left)}
          PaddingRight={new UDim(0, padding.right)}
          PaddingTop={new UDim(0, padding.top)}
        />
      ) : undefined}
      {children}
    </frame>
  );
}
