import React from "@rbxts/react";
import { computePopper } from "./compute";
import { subscribeAnchor, subscribeContent, subscribeViewport } from "./observers";
import { normalizePopperPositioningOptions } from "./options";
import type { ComputePopperResult, UsePopperOptions, UsePopperResult } from "./types";

const WorkspaceService = game.GetService("Workspace");
const RunService = game.GetService("RunService");
const GuiService = game.GetService("GuiService");
const ZERO_VECTOR2 = new Vector2(0, 0);

function readGuiRef(ref: UsePopperOptions["anchorRef"] | UsePopperOptions["contentRef"]): GuiObject | undefined {
  return ref.current;
}

function getDefaultComputedResult(placement: UsePopperOptions["placement"]): ComputePopperResult {
  return {
    anchorPoint: new Vector2(0, 0),
    placement: placement ?? "bottom",
    position: UDim2.fromOffset(0, 0),
  };
}

function areVector2Equal(a: Vector2, b: Vector2) {
  return a.X === b.X && a.Y === b.Y;
}

function hasMeasuredContentSize(contentSize: Vector2) {
  return contentSize.X > 0 || contentSize.Y > 0;
}

function findNearestScreenGui(node: GuiObject | undefined) {
  let current: Instance | undefined = node;
  while (current) {
    if (current.IsA("ScreenGui")) {
      return current;
    }
    current = current.Parent;
  }

  return undefined;
}

function areResultsEqual(a: ComputePopperResult, b: ComputePopperResult) {
  return (
    a.placement === b.placement &&
    a.anchorPoint.X === b.anchorPoint.X &&
    a.anchorPoint.Y === b.anchorPoint.Y &&
    a.position.X.Scale === b.position.X.Scale &&
    a.position.X.Offset === b.position.X.Offset &&
    a.position.Y.Scale === b.position.Y.Scale &&
    a.position.Y.Offset === b.position.Y.Offset
  );
}

function getViewportRect(node: GuiObject | undefined): Rect {
  // Try to find the nearest ScreenGui or PluginGui ancestor to use its absolute size as bounds.
  // This is more accurate for portals than assuming the camera viewport size,
  // especially for studio plugins or non-fullscreen guis.
  if (node) {
    let current: Instance | undefined = node;
    while (current) {
      if (current.IsA("ScreenGui")) {
        let min = new Vector2(0, 0);
        if (!current.IgnoreGuiInset) {
          const [topLeftInset] = GuiService.GetGuiInset();
          min = topLeftInset;
        }
        return new Rect(min, min.add(current.AbsoluteSize));
      }
      current = current.Parent;
    }
  }

  // Fallback to camera viewport size if no container is found.
  const viewportSize = WorkspaceService.CurrentCamera?.ViewportSize ?? new Vector2(1920, 1080);
  return new Rect(new Vector2(0, 0), viewportSize);
}

export function usePopper(options: UsePopperOptions): UsePopperResult {
  const enabled = options.enabled ?? true;
  const normalizedOptions = React.useMemo(
    () => normalizePopperPositioningOptions(options),
    [options.alignOffset, options.collisionPadding, options.placement, options.sideOffset],
  );
  const [computedResult, setComputedResult] = React.useState<ComputePopperResult>(() =>
    getDefaultComputedResult(normalizedOptions.placement),
  );
  const [contentSize, setContentSize] = React.useState<Vector2>(ZERO_VECTOR2);
  const [isPositioned, setIsPositioned] = React.useState(false);

  const update = React.useCallback(() => {
    if (!enabled) {
      return;
    }

    const anchor = readGuiRef(options.anchorRef);
    const content = readGuiRef(options.contentRef);
    if (!anchor) {
      setContentSize((current) => (areVector2Equal(current, ZERO_VECTOR2) ? current : ZERO_VECTOR2));
      setIsPositioned(false);
      return;
    }

    if (!content) {
      setContentSize((current) => (areVector2Equal(current, ZERO_VECTOR2) ? current : ZERO_VECTOR2));
      const viewportRect = getViewportRect(anchor);
      const nextResult = computePopper({
        anchorPosition: anchor.AbsolutePosition,
        anchorSize: anchor.AbsoluteSize,
        contentSize: ZERO_VECTOR2,
        alignOffset: normalizedOptions.alignOffset,
        collisionPadding: normalizedOptions.collisionPadding,
        placement: normalizedOptions.placement,
        sideOffset: normalizedOptions.sideOffset,
        viewportRect,
      });

      setComputedResult((currentResult) => (areResultsEqual(currentResult, nextResult) ? currentResult : nextResult));
      setIsPositioned(false);
      return;
    }

    const measuredContentSize = content.AbsoluteSize;
    setContentSize((current) => (areVector2Equal(current, measuredContentSize) ? current : measuredContentSize));

    const viewportRect = getViewportRect(content ?? anchor);
    const nextResult = computePopper({
      anchorPosition: anchor.AbsolutePosition,
      anchorSize: anchor.AbsoluteSize,
      contentSize: measuredContentSize,
      alignOffset: normalizedOptions.alignOffset,
      collisionPadding: normalizedOptions.collisionPadding,
      placement: normalizedOptions.placement,
      sideOffset: normalizedOptions.sideOffset,
      viewportRect,
    });

    setComputedResult((currentResult) => (areResultsEqual(currentResult, nextResult) ? currentResult : nextResult));
    setIsPositioned(hasMeasuredContentSize(measuredContentSize));
  }, [
    enabled,
    normalizedOptions.alignOffset,
    normalizedOptions.collisionPadding,
    normalizedOptions.placement,
    normalizedOptions.sideOffset,
    options.anchorRef,
    options.contentRef,
  ]);

  React.useLayoutEffect(() => {
    update();
  }, [update]);

  React.useLayoutEffect(() => {
    if (!enabled) {
      setIsPositioned(false);
      setContentSize((current) => (areVector2Equal(current, ZERO_VECTOR2) ? current : ZERO_VECTOR2));
    }
  }, [enabled]);

  React.useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    let disconnectAnchor: (() => void) | undefined;
    let disconnectContent: (() => void) | undefined;
    let disconnectViewport: (() => void) | undefined;
    let observedAnchor: GuiObject | undefined;
    let observedContent: GuiObject | undefined;

    const detachObservers = () => {
      disconnectAnchor?.();
      disconnectAnchor = undefined;

      disconnectContent?.();
      disconnectContent = undefined;

      disconnectViewport?.();
      disconnectViewport = undefined;

      observedAnchor = undefined;
      observedContent = undefined;
    };

    const syncObservers = () => {
      const anchor = readGuiRef(options.anchorRef);
      const content = readGuiRef(options.contentRef);

      if (!anchor || !content) {
        if (observedAnchor || observedContent) {
          detachObservers();
          update();
        }
        return;
      }

      if (anchor === observedAnchor && content === observedContent) {
        return;
      }

      detachObservers();

      disconnectAnchor = subscribeAnchor(anchor, update);
      disconnectContent = subscribeContent(content, update);
      disconnectViewport = subscribeViewport(content, update);
      observedAnchor = anchor;
      observedContent = content;
      update();
    };

    update();
    syncObservers();
    const syncConnection = RunService.Heartbeat.Connect(syncObservers);

    return () => {
      syncConnection.Disconnect();
      detachObservers();
    };
  }, [enabled, options.anchorRef, options.contentRef, update]);

  return React.useMemo(
    () => ({
      ...computedResult,
      contentSize,
      isPositioned,
      update,
    }),
    [computedResult, contentSize, isPositioned, update],
  );
}
