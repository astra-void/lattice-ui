import * as React from "react";
import { Enum } from "./Enum";
import { RunService } from "./RunService";
import { task } from "./task";
import { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
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
  UIPageLayout,
  UIPadding,
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
import { robloxMock, robloxModuleMock, createUniversalRobloxMock, createUniversalRobloxModuleMock } from "./robloxMock";
import { Slot } from "./slot";
import { Box, Text } from "./stylePrimitives";
import { useControllableState } from "./useControllableState";

export interface SetupRobloxEnvironmentTarget {
  Enum?: typeof Enum;
  RunService?: typeof RunService;
  print?: (...args: unknown[]) => void;
  task?: typeof task;
  tostring?: (value: unknown) => string;
}

/**
 * Vite alias note:
 * - Alias broad packages such as `@rbxts/services` or `@flamework/core` to small local shim files.
 * - Re-export only the browser-safe members you need from this package in those shims.
 * - See `README.md` for concrete examples.
 */
export function setupRobloxEnvironment(
  target: SetupRobloxEnvironmentTarget = globalThis as SetupRobloxEnvironmentTarget,
) {
  const initializedTarget = installPreviewRuntimeGlobals(target);

  if (typeof window !== "undefined" && window !== target) {
    installPreviewRuntimeGlobals(window as Window & SetupRobloxEnvironmentTarget);
  }

  return initializedTarget;
}

export type { PreviewEnumCategory, PreviewEnumItem, PreviewEnumRoot } from "./Enum";
export { Enum } from "./Enum";
export { installPreviewRuntimeGlobals } from "./installPreviewRuntimeGlobals";
export type { PreviewPolyfillTarget } from "./polyfills";
export { installPreviewRuntimePolyfills } from "./polyfills";
export type { PreviewRunService, RBXScriptConnection, RBXScriptSignal } from "./RunService";
export { RunService } from "./RunService";
export type { TaskCallback, TaskLibrary } from "./task";
export { task } from "./task";

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
export type { PreviewComponentPropsMetadata, PreviewPropMetadata } from "./previewTypes";
export { createUniversalRobloxMock, createUniversalRobloxModuleMock, robloxMock, robloxModuleMock };
export {
  areViewportsEqual,
  createViewportSize,
  createWindowViewport,
  isViewportLargeEnough,
  measureElementViewport,
  pickViewport,
  type ViewportSize,
} from "./viewport";

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
