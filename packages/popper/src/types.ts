import type React from "@rbxts/react";

export type PopperPlacement = "top" | "bottom" | "left" | "right";

export type PopperPositioningOptions = {
  placement?: PopperPlacement;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
};

export type NormalizedPopperPositioningOptions = {
  placement: PopperPlacement;
  sideOffset: number;
  alignOffset: number;
  collisionPadding: number;
};

export type ComputePopperInput = PopperPositioningOptions & {
  anchorPosition: Vector2;
  anchorSize: Vector2;
  contentSize: Vector2;
  viewportRect: Rect;
};

export type ComputePopperResult = {
  position: UDim2;
  anchorPoint: Vector2;
  placement: PopperPlacement;
};

export type UsePopperOptions = PopperPositioningOptions & {
  anchorRef: React.RefObject<GuiObject> | React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.RefObject<GuiObject> | React.MutableRefObject<GuiObject | undefined>;
  enabled?: boolean;
};

export type UsePopperResult = ComputePopperResult & {
  contentSize: Vector2;
  isPositioned: boolean;
  update: () => void;
};
