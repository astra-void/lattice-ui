export type ResolveGridColumnsOptions = {
  columns?: number;
  minColumnWidth?: number;
  columnGap?: number;
};

export function resolveGridColumns(containerWidth: number, options: ResolveGridColumnsOptions) {
  const explicitColumns = options.columns;
  if (explicitColumns !== undefined && explicitColumns > 0) {
    return math.max(1, math.floor(explicitColumns));
  }

  const minColumnWidth = options.minColumnWidth;
  if (minColumnWidth === undefined || minColumnWidth <= 0) {
    return 1;
  }

  const gap = math.max(0, options.columnGap ?? 0);
  const width = math.max(0, containerWidth);
  const withGap = width + gap;
  const perColumn = minColumnWidth + gap;
  if (perColumn <= 0) {
    return 1;
  }

  return math.max(1, math.floor(withGap / perColumn));
}

export function resolveGridCellWidth(containerWidth: number, columns: number, columnGap: number) {
  const safeColumns = math.max(1, math.floor(columns));
  const safeGap = math.max(0, columnGap);
  const availableWidth = math.max(0, containerWidth - safeGap * (safeColumns - 1));
  return math.max(1, math.floor(availableWidth / safeColumns));
}
