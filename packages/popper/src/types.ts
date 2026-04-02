import type React from "@rbxts/react";

export type PopperPlacement = "top" | "bottom" | "left" | "right";

export type ComputePopperInput = {
  anchorPosition: Vector2;
  anchorSize: Vector2;
  contentSize: Vector2;
  viewportRect: Rect;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
};

export type ComputePopperResult = {
  position: UDim2;
  anchorPoint: Vector2;
  placement: PopperPlacement;
};

export type UsePopperOptions = {
  anchorRef: React.RefObject<GuiObject> | React.MutableRefObject<GuiObject | undefined>;
  contentRef: React.RefObject<GuiObject> | React.MutableRefObject<GuiObject | undefined>;
  placement?: PopperPlacement;
  offset?: Vector2;
  padding?: number;
  enabled?: boolean;
};

export type UsePopperResult = ComputePopperResult & {
  isPositioned: boolean;
  update: () => void;
};
