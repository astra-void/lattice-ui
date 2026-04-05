import type { LayerInteractEvent } from "@lattice-ui/layer";
import type { PopperPlacement } from "@lattice-ui/popper";
import type React from "@rbxts/react";

export type SelectSetOpen = (open: boolean) => void;
export type SelectSetValue = (value: string) => void;

export type SelectItemRegistration = {
  id: number;
  value: string;
  order: number;
  getDisabled: () => boolean;
  getTextValue: () => string;
};

export type SelectContextValue = {
  open: boolean;
  setOpen: SelectSetOpen;
  value?: string;
  setValue: SelectSetValue;
  disabled: boolean;
  required: boolean;
  triggerRef: React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.MutableRefObject<GuiObject | undefined>;
  registerItem: (item: SelectItemRegistration) => () => void;
  getItemText: (value: string) => string | undefined;
};

export type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  children?: React.ReactNode;
};

export type SelectTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type SelectValueProps = {
  asChild?: boolean;
  placeholder?: string;
  children?: React.ReactElement;
};

export type SelectPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type SelectContentProps = {
  asChild?: boolean;
  forceMount?: boolean;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
};

export type SelectItemProps = {
  value: string;
  textValue?: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
};

export type SelectSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type SelectGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type SelectLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
