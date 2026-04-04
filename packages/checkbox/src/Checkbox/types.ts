import type { MotionTransition } from "@lattice-ui/motion";
import type React from "@rbxts/react";

export type CheckedState = boolean | "indeterminate";

export type CheckboxSetChecked = (checked: CheckedState) => void;

export type CheckboxContextValue = {
  checked: CheckedState;
  setChecked: CheckboxSetChecked;
  disabled: boolean;
  required: boolean;
};

export type CheckboxProps = {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
  disabled?: boolean;
  required?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
};

export type CheckboxIndicatorProps = {
  forceMount?: boolean;
  asChild?: boolean;
  transition?: MotionTransition | false;
  children?: React.ReactNode;
};
