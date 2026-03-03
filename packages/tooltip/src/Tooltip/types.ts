import type { LayerInteractEvent } from "@lattice-ui/layer";
import type { PopperPlacement } from "@lattice-ui/popper";
import type React from "@rbxts/react";

export type TooltipSetOpen = (open: boolean) => void;

export type TooltipContextValue = {
  open: boolean;
  setOpen: TooltipSetOpen;
  openWithDelay: () => void;
  close: () => void;
  triggerRef: React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.MutableRefObject<GuiObject | undefined>;
};

export type TooltipProviderContextValue = {
  delayDuration: number;
  skipDelayDuration: number;
  resolveOpenDelay: (requestedDelay?: number) => number;
  markOpen: () => void;
};

export type TooltipProviderProps = {
  delayDuration?: number;
  skipDelayDuration?: number;
  children?: React.ReactNode;
};

export type TooltipProps = {
  open?: boolean;
  defaultOpen?: boolean;
  delayDuration?: number;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

export type TooltipTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type TooltipPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type TooltipContentProps = {
  asChild?: boolean;
  forceMount?: boolean;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  onEscapeKeyDown?: (event: LayerInteractEvent) => void;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
};
