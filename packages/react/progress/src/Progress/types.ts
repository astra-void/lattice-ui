import type { ResponseMotionConfig as MotionConfig } from "@lattice-ui/react-motion";
import type { PassthroughProps } from "@lattice-ui/react-runtime";
import type React from "@rbxts/react";

export type ProgressContextValue = {
  value: number;
  max: number;
  ratio: number;
  indeterminate: boolean;
};

export type ProgressProps = {
  value?: number;
  /** Value used when `value` is not given. Read once, on mount. */
  defaultValue?: number;
  /**
   * @deprecated Progress is display-only and never changes its own value, so this is never
   * called. Drive `value` instead.
   */
  onValueChange?: (value: number) => void;
  /** Must be positive; defaults to 100, and a value of zero or less falls back to 100. */
  max?: number;
  indeterminate?: boolean;
  children?: React.ReactNode;
};

export type ProgressIndicatorProps = {
  transition?: MotionConfig;
  asChild?: boolean;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

export type SpinnerProps = {
  asChild?: boolean;
  spinning?: boolean;
  speedDegPerSecond?: number;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;
