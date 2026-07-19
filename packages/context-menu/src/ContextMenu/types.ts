import type { LayerInteractEvent } from "@lattice-ui/layer";
import type { PresenceMotionConfig as MotionConfig } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import type React from "@rbxts/react";

export type ContextMenuSetOpen = (open: boolean) => void;

export type ContextMenuContextValue = {
  open: boolean;
  setOpen: ContextMenuSetOpen;
  modal: boolean;
  /**
   * Pointer position where the menu was invoked, expressed in the same
   * inset-adjusted space as `GuiObject.AbsolutePosition`. The content mounts a
   * 1x1 virtual anchor here so the shared popper machinery can place and flip
   * the menu against the viewport.
   */
  anchorPosition: Vector2;
  openAtPosition: (position: Vector2) => void;
  virtualAnchorRef: React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.MutableRefObject<GuiObject | undefined>;
};

export type ContextMenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
};

export type ContextMenuTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type ContextMenuPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type ContextMenuContentProps = {
  transition?: MotionConfig;
  asChild?: boolean;
  forceMount?: boolean;
  placement?: PopperPlacement;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
};

export type ContextMenuSelectEvent = {
  defaultPrevented: boolean;
  preventDefault: () => void;
};

export type ContextMenuItemProps = {
  asChild?: boolean;
  disabled?: boolean;
  onSelect?: (event: ContextMenuSelectEvent) => void;
  children?: React.ReactElement;
};

export type ContextMenuSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ContextMenuGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ContextMenuLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
