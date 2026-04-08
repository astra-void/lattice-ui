import type { LayerInteractEvent } from "@lattice-ui/layer";
import type { PresenceMotionConfig as MotionConfig } from "@lattice-ui/motion";
import type { PopperPlacement } from "@lattice-ui/popper";
import type React from "@rbxts/react";

export type ComboboxFilterFn = (itemText: string, query: string) => boolean;

export type ComboboxSetOpen = (open: boolean) => void;
export type ComboboxSetValue = (value: string) => void;
export type ComboboxSetInputValue = (inputValue: string) => void;

export type ComboboxItemRegistration = {
  id: number;
  value: string;
  order: number;
  getDisabled: () => boolean;
  getTextValue: () => string;
};

export type ComboboxContextValue = {
  open: boolean;
  setOpen: ComboboxSetOpen;
  value?: string;
  setValue: ComboboxSetValue;
  inputValue: string;
  setInputValue: ComboboxSetInputValue;
  syncInputFromValue: () => void;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  filterFn: ComboboxFilterFn;
  anchorRef: React.MutableRefObject<GuiObject | undefined>;
  triggerRef: React.MutableRefObject<GuiObject | undefined>;
  inputRef: React.MutableRefObject<TextBox | undefined>;
  contentRef: React.MutableRefObject<GuiObject | undefined>;
  registerItem: (item: ComboboxItemRegistration) => () => void;
  getItemText: (value: string) => string | undefined;
};

export type ComboboxProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (inputValue: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  filterFn?: ComboboxFilterFn;
  children?: React.ReactNode;
};

export type ComboboxTriggerProps = {
  asChild?: boolean;
  disabled?: boolean;
  children?: React.ReactElement;
};

export type ComboboxInputProps = {
  asChild?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  children?: React.ReactElement;
};

export type ComboboxValueProps = {
  asChild?: boolean;
  placeholder?: string;
  children?: React.ReactElement;
};

export type ComboboxPortalProps = {
  container?: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type ComboboxContentProps = {
  transition?: MotionConfig;
  asChild?: boolean;
  forceMount?: boolean;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  children?: React.ReactNode;
};

export type ComboboxItemProps = {
  value: string;
  textValue?: string;
  disabled?: boolean;
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ComboboxSeparatorProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ComboboxGroupProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};

export type ComboboxLabelProps = {
  asChild?: boolean;
  children?: React.ReactElement;
};
