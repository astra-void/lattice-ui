import { React } from "@lattice-ui/core";
import { mergeGuiProps, resolveSx, useTheme } from "@lattice-ui/style";
import { resolveGridCellWidth, resolveGridColumns } from "./gridMath";
import { resolvePadding, resolveSpace } from "./space";
import type { GridProps } from "./types";

type StyleProps = React.Attributes & Record<string, unknown>;

export function Grid(props: GridProps) {
  const gap = props.gap ?? 0;
  const rowGap = props.rowGap ?? gap;
  const columnGap = props.columnGap ?? gap;
  const autoSize = props.autoSize ?? false;
  const columns = props.columns;
  const minColumnWidth = props.minColumnWidth;
  const cellHeight = props.cellHeight ?? 32;
  const children = props.children;
  const sx = props.sx;
  const asChild = (props as { asChild?: unknown }).asChild;

  if (asChild !== undefined) {
    error("[Grid] `asChild` is not supported in M3.");
  }

  const restProps: StyleProps = {};
  for (const [rawKey, value] of pairs(props as Record<string, unknown>)) {
    if (!typeIs(rawKey, "string")) {
      continue;
    }

    if (
      rawKey === "gap" ||
      rawKey === "rowGap" ||
      rawKey === "columnGap" ||
      rawKey === "columns" ||
      rawKey === "minColumnWidth" ||
      rawKey === "cellHeight" ||
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
  const resolvedRowGap = resolveSpace(theme, rowGap);
  const resolvedColumnGap = resolveSpace(theme, columnGap);
  const resolvedMinColumnWidth = minColumnWidth !== undefined ? resolveSpace(theme, minColumnWidth) : undefined;
  const resolvedCellHeight = resolveSpace(theme, cellHeight);
  const padding = resolvePadding(theme, props);
  const hasPadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;

  const [layoutState, setLayoutState] = React.useState(() => ({
    columns: resolveGridColumns(0, {
      columns,
      minColumnWidth: resolvedMinColumnWidth,
      columnGap: resolvedColumnGap,
    }),
    cellWidth: math.max(1, resolvedMinColumnWidth ?? 120),
  }));

  const frameRef = React.useRef<Frame>();

  const setFrameRef = React.useCallback((instance: Instance | undefined) => {
    if (!instance?.IsA("Frame")) {
      frameRef.current = undefined;
      return;
    }

    frameRef.current = instance;
  }, []);

  const updateLayout = React.useCallback(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const containerWidth = frame.AbsoluteSize.X - padding.left - padding.right;
    const nextColumns = resolveGridColumns(containerWidth, {
      columns,
      minColumnWidth: resolvedMinColumnWidth,
      columnGap: resolvedColumnGap,
    });
    const nextCellWidth = resolveGridCellWidth(containerWidth, nextColumns, resolvedColumnGap);

    setLayoutState((current) => {
      if (current.columns === nextColumns && current.cellWidth === nextCellWidth) {
        return current;
      }

      return {
        columns: nextColumns,
        cellWidth: nextCellWidth,
      };
    });
  }, [columns, padding.left, padding.right, resolvedColumnGap, resolvedMinColumnWidth]);

  React.useEffect(() => {
    updateLayout();

    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const sizeConnection = frame.GetPropertyChangedSignal("AbsoluteSize").Connect(updateLayout);
    return () => {
      sizeConnection.Disconnect();
    };
  }, [updateLayout]);

  const sxProps = resolveSx(sx, theme);
  const baseProps: Partial<StyleProps> = {
    BackgroundTransparency: 1,
    BorderSizePixel: 0,
    AutomaticSize:
      autoSize === true
        ? Enum.AutomaticSize.Y
        : autoSize === "x"
          ? Enum.AutomaticSize.X
          : autoSize === "y"
            ? Enum.AutomaticSize.Y
            : autoSize === "xy"
              ? Enum.AutomaticSize.XY
              : Enum.AutomaticSize.None,
  };
  const mergedProps = mergeGuiProps(baseProps, sxProps, restProps);

  return (
    <frame {...(mergedProps as Record<string, unknown>)} ref={setFrameRef}>
      <uigridlayout
        CellPadding={UDim2.fromOffset(resolvedColumnGap, resolvedRowGap)}
        CellSize={UDim2.fromOffset(layoutState.cellWidth, resolvedCellHeight)}
        FillDirectionMaxCells={layoutState.columns}
        SortOrder={Enum.SortOrder.LayoutOrder}
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
