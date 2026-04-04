import type { MotionTransition } from "@lattice-ui/motion";
import type React from "@rbxts/react";

export type SwitchSetChecked = (checked: boolean) => void;

export type SwitchContextValue = {
  checked: boolean;
  setChecked: SwitchSetChecked;
  disabled: boolean;
};

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
};

export type SwitchThumbProps = {
  forceMount?: boolean;
  asChild?: boolean;
  transition?: MotionTransition | false;
  children?: React.ReactNode;
};
