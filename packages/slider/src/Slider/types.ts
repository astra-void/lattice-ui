import type React from "@rbxts/react";

export type SliderOrientation = "horizontal" | "vertical";

export type SliderSetValue = (value: number) => void;
export type SliderCommitValue = (value: number) => void;

export type SliderContextValue = {
  value: number;
  setValue: SliderSetValue;
  commitValue: SliderCommitValue;
  min: number;
  max: number;
  step: number;
  orientation: SliderOrientation;
  disabled: boolean;
  setTrackNode: (instance: Instance | undefined) => void;
  setThumbNode: (instance: Instance | undefined) => void;
  startDrag: (inputObject: InputObject) => void;
};

export type SliderProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderOrientation;
  disabled?: boolean;
  children?: React.ReactNode;
};

export type SliderTrackProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type SliderRangeProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type SliderThumbProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
