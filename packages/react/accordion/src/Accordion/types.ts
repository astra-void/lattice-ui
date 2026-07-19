import type { PresenceMotionConfig } from "@lattice-ui/react-motion";
import type { PassthroughProps } from "@lattice-ui/react-runtime";
import type React from "@rbxts/react";
import type { AccordionType } from "./state";

export type AccordionContextValue = {
  type: AccordionType;
  openValues: Array<string>;
  toggleItem: (value: string) => void;
};

export type AccordionItemContextValue = {
  value: string;
  open: boolean;
  disabled: boolean;
};

export type AccordionProps = {
  type?: AccordionType;
  value?: string | Array<string>;
  defaultValue?: string | Array<string>;
  onValueChange?: (value: string | Array<string>) => void;
  collapsible?: boolean;
  children?: React.ReactNode;
};

export type AccordionItemProps = {
  value: string;
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
} & PassthroughProps;

export type AccordionHeaderProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type AccordionTriggerProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type AccordionContentProps = {
  asChild?: boolean;
  forceMount?: boolean;
  transition?: PresenceMotionConfig;
  children?: React.ReactNode;
} & PassthroughProps;
