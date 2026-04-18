import type React from "@rbxts/react";

export type SwitchSetChecked = (checked: boolean) => void;

export type SwitchTrackColorMode = "consumer" | "switch";

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
  /**
   * Controls who owns track `BackgroundColor3` updates.
   *
   * - `"switch"`: the primitive animates checked/unchecked/disabled track colors.
   * - `"consumer"`: the slotted/root track keeps consumer-provided colors.
   *
   * Defaults:
   * - `asChild={false}` defaults to `"switch"`.
   * - `asChild={true}` defaults to `"consumer"` unless track color props are provided.
   *
   * When set, this prop takes precedence over the legacy implicit color-prop fallback.
   */
  trackColorMode?: SwitchTrackColorMode;
  trackOnColor?: Color3;
  trackOffColor?: Color3;
  disabledTrackColor?: Color3;
  asChild?: boolean;
  children?: React.ReactNode;
};

export type SwitchThumbProps = {
  forceMount?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
};
