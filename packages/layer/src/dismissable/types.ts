import type React from "@rbxts/react";

export type LayerInteractEvent = {
  originalEvent: InputObject;
  defaultPrevented: boolean;
  preventDefault: () => void;
};

export type DismissableLayerProps = {
  children?: React.ReactNode;
  enabled?: boolean;
  insideRefs?: Array<React.MutableRefObject<GuiObject | undefined> | React.MutableRefObject<TextBox | undefined>>;
  modal?: boolean;
  disableOutsidePointerEvents?: boolean;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  onDismiss?: () => void;
};
