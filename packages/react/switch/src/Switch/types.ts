import type { PassthroughProps } from "@lattice-ui/react-runtime";
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
} & PassthroughProps;

export type SwitchThumbProps = {
  asChild?: boolean;
  children?: React.ReactNode;
} & PassthroughProps;
