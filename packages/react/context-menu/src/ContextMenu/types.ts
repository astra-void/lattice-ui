import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import type { PresenceMotionConfig as MotionConfig } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import type { PassthroughProps } from "@lattice-ui/react-runtime";
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

/** Per-item state consumers read to style the item; the primitive never paints it. */
export type ContextMenuItemContextValue = {
  highlighted: boolean;
  disabled: boolean;
};

export type ContextMenuTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

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
} & PassthroughProps;

export type ContextMenuSelectEvent = {
  defaultPrevented: boolean;
  preventDefault: () => void;
};

export type ContextMenuItemProps = {
  asChild?: boolean;
  disabled?: boolean;
  onSelect?: (event: ContextMenuSelectEvent) => void;
  children?: React.ReactElement;
} & PassthroughProps;

export type ContextMenuSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type ContextMenuGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type ContextMenuLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;
