import type { PassthroughProps } from "@lattice-ui/react-runtime";
import type React from "@rbxts/react";

export type ToggleGroupType = "single" | "multiple";
export type ToggleGroupValue = string | string[];
export type ToggleGroupOrientation = "horizontal" | "vertical";

export type ToggleGroupItemRegistration = {
  id: number;
  value: string;
  order: number;
  ref: React.MutableRefObject<GuiObject | undefined>;
  getDisabled: () => boolean;
};

export type ToggleGroupCommonProps = {
  disabled?: boolean;
  // Axis the arrow keys rove along. Defaults to "horizontal".
  orientation?: ToggleGroupOrientation;
  asChild?: boolean;
  children?: React.ReactNode;
} & PassthroughProps<Frame>;

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
  orientation: ToggleGroupOrientation;
  isPressed: (itemValue: string) => boolean;
  toggleValue: (itemValue: string) => void;
  registerItem: (item: ToggleGroupItemRegistration) => () => void;
  // Moves focus to the neighbouring item. Unlike RadioGroup, pressing state does not follow focus.
  moveFocus: (fromValue: string, direction: -1 | 1) => void;
};

export type ToggleGroupItemProps = {
  value: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<TextButton>;
