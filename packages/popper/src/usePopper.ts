import React from "@rbxts/react";
import { computePopper } from "./compute";
import { subscribeAnchor, subscribeContent, subscribeViewport } from "./observers";
import type { ComputePopperResult, UsePopperOptions, UsePopperResult } from "./types";

const WorkspaceService = game.GetService("Workspace");
const RunService = game.GetService("RunService");
const GuiService = game.GetService("GuiService");

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
  const [computedResult, setComputedResult] = React.useState<ComputePopperResult>(() =>
    getDefaultComputedResult(options.placement),
  );
  const [isPositioned, setIsPositioned] = React.useState(false);

  const update = React.useCallback(() => {
    if (!enabled) {
      return;
    }

    const anchor = readGuiRef(options.anchorRef);
    const content = readGuiRef(options.contentRef);
    if (!anchor) {
      setIsPositioned(false);
      return;
    }

    if (!content) {
      const viewportRect = getViewportRect(anchor);
      const nextResult = computePopper({
        anchorPosition: anchor.AbsolutePosition,
        anchorSize: anchor.AbsoluteSize,
        contentSize: new Vector2(0, 0),
        offset: options.offset,
        padding: options.padding,
        placement: options.placement,
        viewportRect,
      });

      setComputedResult((currentResult) => (areResultsEqual(currentResult, nextResult) ? currentResult : nextResult));
      setIsPositioned(false);
      return;
    }

    const viewportRect = getViewportRect(content ?? anchor);
    const nextResult = computePopper({
      anchorPosition: anchor.AbsolutePosition,
      anchorSize: anchor.AbsoluteSize,
      contentSize: content.AbsoluteSize,
      offset: options.offset,
      padding: options.padding,
      placement: options.placement,
      viewportRect,
    });

    setComputedResult((currentResult) => (areResultsEqual(currentResult, nextResult) ? currentResult : nextResult));
    setIsPositioned(true);
  }, [enabled, options.anchorRef, options.contentRef, options.offset, options.padding, options.placement]);

  React.useLayoutEffect(() => {
    update();
  }, [update]);

  React.useLayoutEffect(() => {
    if (!enabled) {
      setIsPositioned(false);
    }
  }, [enabled]);

  React.useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    let disconnectAnchor: (() => void) | undefined;
    let disconnectContent: (() => void) | undefined;
    let disconnectViewport: (() => void) | undefined;
    let waitForRefsConnection: RBXScriptConnection | undefined;
    let attached = false;

    const attachObservers = () => {
      if (attached) {
        return true;
      }

      const anchor = readGuiRef(options.anchorRef);
      const content = readGuiRef(options.contentRef);
      if (!anchor || !content) {
        return false;
      }

      disconnectAnchor = subscribeAnchor(anchor, update);
      disconnectContent = subscribeContent(content, update);
      disconnectViewport = subscribeViewport(content, update);
      attached = true;
      return true;
    };

    if (!attachObservers()) {
      waitForRefsConnection = RunService.Heartbeat.Connect(() => {
        if (attachObservers()) {
          if (waitForRefsConnection) {
            waitForRefsConnection.Disconnect();
            waitForRefsConnection = undefined;
          }
          update();
        }
      });
    } else {
      update();
    }

    return () => {
      if (waitForRefsConnection) {
        waitForRefsConnection.Disconnect();
        waitForRefsConnection = undefined;
      }

      disconnectAnchor?.();
      disconnectContent?.();
      disconnectViewport?.();
    };
  }, [enabled, options.anchorRef, options.contentRef, update]);

  return React.useMemo(
    () => ({
      ...computedResult,
      isPositioned,
      update,
    }),
    [computedResult, isPositioned, update],
  );
}
