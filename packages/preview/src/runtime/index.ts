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
  UIAspectRatioConstraint,
  UICorner,
  UIFlexItem,
  UIGradient,
  UIGridLayout,
  UIListLayout,
  UIPadding,
  UIPageLayout,
  UIScale,
  UISizeConstraint,
  UIStroke,
  UITableLayout,
  UITextSizeConstraint,
} from "./domHost";
import { FocusScope } from "./focusScope";
import { __previewGlobal, Color3, error, isPreviewElement, pairs, typeIs, UDim, UDim2, Vector2 } from "./helpers";
import { LayoutProvider, useLayoutEngineStatus, useRobloxLayout } from "./LayoutProvider";
import { Portal, PortalProvider, usePortalContext } from "./portal";
import { Presence } from "./presence";
import { Slot } from "./slot";
import { Box, Text } from "./stylePrimitives";
import { useControllableState } from "./useControllableState";
export {
  AutoMockProvider,
  buildAutoMockProps,
  withAutoMockedProps,
  type PreviewAutoMockableComponent,
} from "./AutoMockProvider";

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
  UIScale,
  UIGradient,
  UIPageLayout,
  UITableLayout,
  UISizeConstraint,
  UITextSizeConstraint,
  UIAspectRatioConstraint,
  UIFlexItem,
};
export { __previewGlobal, Color3, UDim, UDim2, Vector2, typeIs, pairs, error, isPreviewElement };
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
    UIScale: typeof UIScale;
    UIGradient: typeof UIGradient;
    UIPageLayout: typeof UIPageLayout;
    UITableLayout: typeof UITableLayout;
    UISizeConstraint: typeof UISizeConstraint;
    UITextSizeConstraint: typeof UITextSizeConstraint;
    UIAspectRatioConstraint: typeof UIAspectRatioConstraint;
    UIFlexItem: typeof UIFlexItem;
  };
  helpers: {
    __previewGlobal: typeof __previewGlobal;
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
    UIScale,
    UIGradient,
    UIPageLayout,
    UITableLayout,
    UISizeConstraint,
    UITextSizeConstraint,
    UIAspectRatioConstraint,
    UIFlexItem,
  },
  helpers: {
    __previewGlobal,
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
