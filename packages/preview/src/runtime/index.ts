import * as React from "react";
import { createStrictContext } from "./context";
import { DismissableLayer, type LayerInteractEvent } from "./dismissableLayer";
import {
  Frame,
  ImageLabel,
  ScreenGui,
  ScrollingFrame,
  TextBox,
  TextButton,
  TextLabel,
  UICorner,
  UIGridLayout,
  UIListLayout,
  UIPadding,
  UIStroke,
} from "./domHost";
import { FocusScope } from "./focusScope";
import { Color3, error, isPreviewElement, pairs, typeIs, UDim, UDim2, Vector2 } from "./helpers";
import { Portal, PortalProvider, usePortalContext } from "./portal";
import { Box, Text } from "./stylePrimitives";
import { Presence } from "./presence";
import { Slot } from "./slot";
import { useControllableState } from "./useControllableState";

export { React };
export { createStrictContext, useControllableState, Slot };
export { Portal, PortalProvider, usePortalContext, Presence, DismissableLayer, FocusScope };
export {
  Frame,
  TextButton,
  ScreenGui,
  TextLabel,
  TextBox,
  ImageLabel,
  ScrollingFrame,
  UICorner,
  UIPadding,
  UIListLayout,
  UIGridLayout,
  UIStroke,
};
export { Color3, UDim, UDim2, Vector2, typeIs, pairs, error, isPreviewElement };
export { __rbxStyle } from "./style";
export { Box, Text };
export type { LayerInteractEvent };

export type PreviewRuntime = {
  hosts: {
    Frame: typeof Frame;
    TextButton: typeof TextButton;
    ScreenGui: typeof ScreenGui;
    TextLabel: typeof TextLabel;
    TextBox: typeof TextBox;
    ImageLabel: typeof ImageLabel;
    ScrollingFrame: typeof ScrollingFrame;
    UICorner: typeof UICorner;
    UIPadding: typeof UIPadding;
    UIListLayout: typeof UIListLayout;
    UIGridLayout: typeof UIGridLayout;
    UIStroke: typeof UIStroke;
  };
  helpers: {
    Color3: typeof Color3;
    UDim: typeof UDim;
    UDim2: typeof UDim2;
    Vector2: typeof Vector2;
    typeIs: typeof typeIs;
    pairs: typeof pairs;
    error: typeof error;
    isPreviewElement: typeof isPreviewElement;
  };
  primitives: {
    Slot: typeof Slot;
    Portal: typeof Portal;
    PortalProvider: typeof PortalProvider;
    Presence: typeof Presence;
    DismissableLayer: typeof DismissableLayer;
    FocusScope: typeof FocusScope;
    createStrictContext: typeof createStrictContext;
    useControllableState: typeof useControllableState;
  };
};

export const previewRuntime: PreviewRuntime = {
  hosts: {
    Frame,
    TextButton,
    ScreenGui,
    TextLabel,
    TextBox,
    ImageLabel,
    ScrollingFrame,
    UICorner,
    UIPadding,
    UIListLayout,
    UIGridLayout,
    UIStroke,
  },
  helpers: {
    Color3,
    UDim,
    UDim2,
    Vector2,
    typeIs,
    pairs,
    error,
    isPreviewElement,
  },
  primitives: {
    Slot,
    Portal,
    PortalProvider,
    Presence,
    DismissableLayer,
    FocusScope,
    createStrictContext,
    useControllableState,
  },
};
