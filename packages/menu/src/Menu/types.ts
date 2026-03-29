import type { MotionTransition } from "@lattice-ui/core";
import type { LayerInteractEvent } from "@lattice-ui/layer";
import type { PopperPlacement } from "@lattice-ui/popper";
import type React from "@rbxts/react";

export type MenuSetOpen = (open: boolean) => void;

export type MenuItemRegistration = {
  id: number;
  order: number;
  ref: React.MutableRefObject<GuiObject | undefined>;
  getDisabled: () => boolean;
};

export type MenuContextValue = {
  open: boolean;
  setOpen: MenuSetOpen;
  modal: boolean;
  triggerRef: React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.MutableRefObject<GuiObject | undefined>;
  registerItem: (item: MenuItemRegistration) => () => void;
  focusFirstItem: () => void;
  moveSelection: (direction: -1 | 1) => void;
  restoreTriggerFocus: () => void;
};

export type MenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
};

export type MenuTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type MenuPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type MenuContentProps = {
  asChild?: boolean;
  forceMount?: boolean;
  transition?: MotionTransition | false;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
};

export type MenuSelectEvent = {
  defaultPrevented: boolean;
  preventDefault: () => void;
};

export type MenuItemProps = {
  asChild?: boolean;
  disabled?: boolean;
  onSelect?: (event: MenuSelectEvent) => void;
  children?: React.ReactElement;
};

export type MenuSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type MenuGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type MenuLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
