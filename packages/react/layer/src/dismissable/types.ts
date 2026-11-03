import type React from "@rbxts/react";

export type LayerInteractEvent = {
  originalEvent: InputObject;
  defaultPrevented: boolean;
  preventDefault: () => void;
};

export type DismissableLayerProps = {
  children?: React.ReactNode;
  enabled?: boolean;
  contentBoundaryRef?: React.MutableRefObject<GuiObject | undefined>;
  insideRefs?: Array<React.MutableRefObject<GuiObject | undefined> | React.MutableRefObject<TextBox | undefined>>;
  modal?: boolean;
  disableOutsidePointerEvents?: boolean;
  onPointerDownOutside?: (event: LayerInteractEvent) => void;
  onInteractOutside?: (event: LayerInteractEvent) => void;
  /**
   * Called when the dismiss key (gamepad `ButtonB`, keyboard `Backspace`) is pressed while this is
   * the top-most enabled layer. Call `preventDefault()` to keep the layer open.
   */
  onEscapeKeyDown?: (event: LayerInteractEvent) => void;
  onDismiss?: () => void;
};
