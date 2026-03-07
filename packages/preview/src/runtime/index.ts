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
import { LayoutProvider, useLayoutEngineStatus, useRobloxLayout } from "./LayoutProvider";
import { Portal, PortalProvider, usePortalContext } from "./portal";
import { Presence } from "./presence";
import { Slot } from "./slot";
import { Box, Text } from "./stylePrimitives";
import { useControllableState } from "./useControllableState";

export { React };
export { createStrictContext, useControllableState, Slot };
export { Portal, PortalProvider, usePortalContext, Presence, DismissableLayer, FocusScope };
export { LayoutProvider, useRobloxLayout, useLayoutEngineStatus };
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
    LayoutProvider: typeof LayoutProvider;
    useRobloxLayout: typeof useRobloxLayout;
    useLayoutEngineStatus: typeof useLayoutEngineStatus;
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
    LayoutProvider,
    useRobloxLayout,
    useLayoutEngineStatus,
    Portal,
    PortalProvider,
    Presence,
    DismissableLayer,
    FocusScope,
    createStrictContext,
    useControllableState,
  },
};
