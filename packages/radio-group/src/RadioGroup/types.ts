import type React from "@rbxts/react";

export type RadioGroupOrientation = "horizontal" | "vertical" | "both";

export type RadioGroupSetValue = (value: string) => void;

export type RadioGroupContextValue = {
  value?: string;
  setValue: RadioGroupSetValue;
  disabled: boolean;
  required: boolean;
};

export type RadioGroupItemContextValue = {
  checked: boolean;
  disabled: boolean;
};

export type RadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  loop?: boolean;
  orientation?: RadioGroupOrientation;
  children?: React.ReactNode;
};

export type RadioGroupItemProps = {
  value: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
};

export type RadioGroupIndicatorProps = {
  forceMount?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
};
