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
};

export type AccordionHeaderProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type AccordionTriggerProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type AccordionContentProps = {
  asChild?: boolean;
  forceMount?: boolean;
  children?: React.ReactNode;
};
