import type { LayerInteractEvent } from "@lattice-ui/react-layer";
import type { PresenceMotionConfig as MotionConfig } from "@lattice-ui/react-motion";
import type { PopperPlacement } from "@lattice-ui/react-popper";
import type { PassthroughProps } from "@lattice-ui/react-runtime";
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

/** Per-item state consumers read to style the item; the primitive never paints it. */
export type SelectItemContextValue = {
  highlighted: boolean;
  disabled: boolean;
};

// `Select` renders no instance of its own (it is a context provider), so it takes no passthrough
// props. Every part below renders an instance and forwards unknown props onto it.
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
} & PassthroughProps<TextButton>;

export type SelectValueProps = {
  asChild?: boolean;
  placeholder?: string;
  children?: React.ReactElement;
} & PassthroughProps<TextLabel>;

export type SelectPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type SelectContentProps = {
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

export type SelectItemProps = {
  value: string;
  textValue?: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<TextButton>;

export type SelectSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<Frame>;

export type SelectGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<Frame>;

export type SelectLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
} & PassthroughProps<TextLabel>;
