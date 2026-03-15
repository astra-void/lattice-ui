import type React from "@rbxts/react";

export type RadioGroupSetValue = (value: string) => void;
export type RadioGroupOrientation = "horizontal" | "vertical";

export type RadioGroupItemRegistration = {
  id: number;
  value: string;
  order: number;
  ref: React.MutableRefObject<GuiObject | undefined>;
  getDisabled: () => boolean;
};

export type RadioGroupContextValue = {
  value?: string;
  setValue: RadioGroupSetValue;
  disabled: boolean;
  required: boolean;
  orientation: RadioGroupOrientation;
  registerItem: (item: RadioGroupItemRegistration) => () => void;
  moveSelection: (fromValue: string, direction: -1 | 1) => void;
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
