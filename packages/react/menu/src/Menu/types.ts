import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import type { PresenceMotionConfig as MotionConfig } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import type { PassthroughProps } from "@lattice-ui/react-runtime";
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
  restoreTriggerFocus: () => void;
};

export type MenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
};

/** Per-item state consumers read to style the item; the primitive never paints it. */
export type MenuItemContextValue = {
  highlighted: boolean;
  disabled: boolean;
};

export type MenuTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<TextButton>;

export type MenuPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type MenuContentProps = {
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
} & PassthroughProps<CanvasGroup>;

export type MenuSelectEvent = {
  defaultPrevented: boolean;
  preventDefault: () => void;
};

export type MenuItemProps = {
  asChild?: boolean;
  disabled?: boolean;
  onSelect?: (event: MenuSelectEvent) => void;
  children?: React.ReactElement;
} & PassthroughProps<TextButton>;

export type MenuSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<Frame>;

export type MenuGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<Frame>;

export type MenuLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<TextLabel>;
