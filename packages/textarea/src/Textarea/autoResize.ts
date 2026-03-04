export type TextareaAutoResizeOptions = {
  minRows: number;
  maxRows?: number;
  lineHeight: number;
  verticalPadding?: number;
};

function countLines(text: string) {
  if (text.size() === 0) {
    return 1;
  }

  return text.split("\n").size();
}

export function resolveTextareaHeight(text: string, options: TextareaAutoResizeOptions) {
  const minRows = math.max(1, math.floor(options.minRows));
  const maxRows = options.maxRows !== undefined ? math.max(minRows, math.floor(options.maxRows)) : undefined;
  const lineHeight = math.max(1, options.lineHeight);
  const verticalPadding = math.max(0, options.verticalPadding ?? 0);

  const naturalRows = countLines(text);
  const clampedRows = maxRows !== undefined ? math.clamp(naturalRows, minRows, maxRows) : math.max(minRows, naturalRows);

  return clampedRows * lineHeight + verticalPadding;
}
