import { ProgressIndicator } from "./Progress/ProgressIndicator";
import { ProgressRoot } from "./Progress/ProgressRoot";
import { Spinner } from "./Progress/Spinner";

export const Progress = {
  Root: ProgressRoot,
  Indicator: ProgressIndicator,
  Spinner,
} as const;

export { useProgressContext } from "./Progress/context";
export { clampProgressValue, INDETERMINATE_PROGRESS_RATIO, resolveProgressRatio } from "./Progress/math";
export type { ProgressContextValue, ProgressIndicatorProps, ProgressProps, SpinnerProps } from "./Progress/types";
