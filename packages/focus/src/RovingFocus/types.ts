import type React from "@rbxts/react";

export type RovingDirection = "next" | "prev";
export type RovingOrientation = "horizontal" | "vertical" | "both";
export type RovingAutoFocus = "none" | "first";

export type RovingFocusGroupProps = {
  loop?: boolean;
  orientation?: RovingOrientation;
  active?: boolean;
  autoFocus?: RovingAutoFocus;
  children?: React.ReactNode;
};

export type RovingFocusItemProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type RovingItemRegistration = {
  id: number;
  getNode: () => GuiObject | undefined;
  getDisabled: () => boolean;
};

export type RovingFocusContextValue = {
  registerItem: (item: RovingItemRegistration) => () => void;
  navigationEnabled: boolean;
  children?: React.ReactNode;
};
