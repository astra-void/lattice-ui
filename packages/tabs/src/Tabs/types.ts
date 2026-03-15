import type React from "@rbxts/react";

export type TabsSetValue = (value: string) => void;

export type TabsTriggerRegistration = {
  id: number;
  value: string;
  disabled: boolean;
  ref: React.MutableRefObject<GuiObject | undefined>;
  order: number;
};

export type TabsContextValue = {
  value?: string;
  setValue: TabsSetValue;
  registerTrigger: (trigger: TabsTriggerRegistration) => () => void;
};

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
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
