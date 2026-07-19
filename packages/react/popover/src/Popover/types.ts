import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import type { PresenceMotionConfig as MotionConfig } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import type { PassthroughProps } from "@lattice-ui/react-runtime";
import type React from "@rbxts/react";

export type PopoverSetOpen = (open: boolean) => void;

export type PopoverContextValue = {
  open: boolean;
  setOpen: PopoverSetOpen;
  modal: boolean;
  triggerRef: React.MutableRefObject<GuiObject | undefined>;
  anchorRef: React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.MutableRefObject<GuiObject | undefined>;
};

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
};

export type PopoverTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type PopoverPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type PopoverContentProps = {
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

export type PopoverAnchorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;

export type PopoverCloseProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps;
