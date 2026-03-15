import type React from "@rbxts/react";

export type TabsSetValue = (value: string) => void;
export type TabsOrientation = "horizontal" | "vertical";

export type TabsTriggerRegistration = {
  id: number;
  value: string;
  ref: React.MutableRefObject<GuiObject | undefined>;
  order: number;
  getDisabled: () => boolean;
};

export type TabsContextValue = {
  value?: string;
  orientation: TabsOrientation;
  setValue: TabsSetValue;
  registerTrigger: (trigger: TabsTriggerRegistration) => () => void;
  moveSelection: (fromValue: string, direction: -1 | 1) => void;
};

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  children?: React.ReactNode;
};

export type TabsListProps = {
  asChild?: boolean;
  children?: React.ReactNode;
};

export type TabsTriggerProps = {
  value: string;
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type TabsContentProps = {
  value: string;
  asChild?: boolean;
  forceMount?: boolean;
  children?: React.ReactNode;
};
