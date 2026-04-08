import type { ResponseMotionConfig as MotionConfig } from "@lattice-ui/motion";
import type React from "@rbxts/react";

export type ProgressContextValue = {
  value: number;
  max: number;
  ratio: number;
  indeterminate: boolean;
};

export type ProgressProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  indeterminate?: boolean;
  children?: React.ReactNode;
};

export type ProgressIndicatorProps = {
  transition?: MotionConfig;
  asChild?: boolean;
  children?: React.ReactElement;
};

export type SpinnerProps = {
  asChild?: boolean;
  spinning?: boolean;
  speedDegPerSecond?: number;
  children?: React.ReactElement;
};
