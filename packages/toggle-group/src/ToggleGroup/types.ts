import type { MotionConfig } from "@lattice-ui/motion";
import type React from "@rbxts/react";

export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupValue = string | string[];

export type ToggleGroupCommonProps = {
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
};

export type ToggleGroupSingleProps = {
  type: "single";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
};

export type ToggleGroupMultipleProps = {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export type ToggleGroupProps = ToggleGroupCommonProps & (ToggleGroupSingleProps | ToggleGroupMultipleProps);

export type ToggleGroupContextValue = {
  type: ToggleGroupType;
  disabled: boolean;
  isPressed: (itemValue: string) => boolean;
  toggleValue: (itemValue: string) => void;
};

export type ToggleGroupItemProps = {
  transition?: MotionConfig;
  value: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
};
