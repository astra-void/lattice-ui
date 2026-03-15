import type { LayerInteractEvent } from "@lattice-ui/layer";
import type React from "@rbxts/react";

export type DialogSetOpen = (open: boolean) => void;

export type DialogContextValue = {
  open: boolean;
  setOpen: DialogSetOpen;
  modal: boolean;
  triggerRef: React.MutableRefObject<GuiObject | undefined>;
};

export type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
};

export type DialogTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type DialogPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type DialogOverlayProps = {
  asChild?: boolean;
  forceMount?: boolean;
  children?: React.ReactElement;
};

export type DialogContentProps = {
  forceMount?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
};

export type DialogCloseProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
