import type React from "@rbxts/react";
import { computePopper } from "./compute";
import type { UsePopperOptions, UsePopperResult } from "./types";

const WorkspaceService = game.GetService("Workspace");

function readGuiRef(
  ref: React.RefObject<GuiObject> | React.MutableRefObject<GuiObject | undefined>,
): GuiObject | undefined {
  return ref.current;
}

function getDefaultResult(placement: UsePopperOptions["placement"]): UsePopperResult {
  const resolvedPlacement = placement ?? "bottom";
  const noop = () => {};
  return {
    anchorPoint: new Vector2(0, 0),
    placement: resolvedPlacement,
    position: UDim2.fromOffset(0, 0),
    update: noop,
  };
}

export function usePopper(options: UsePopperOptions): UsePopperResult {
  let currentResult = getDefaultResult(options.placement);

  const update = () => {
    if (options.enabled === false) {
      return;
    }

    const anchor = readGuiRef(options.anchorRef);
    const content = readGuiRef(options.contentRef);
    if (!anchor || !content) {
      return;
    }

    const viewportSize = WorkspaceService.CurrentCamera?.ViewportSize ?? new Vector2(1920, 1080);
    const computed = computePopper({
      anchorPosition: anchor.AbsolutePosition,
      anchorSize: anchor.AbsoluteSize,
      contentSize: content.AbsoluteSize,
      viewportSize,
      placement: options.placement,
      offset: options.offset,
      padding: options.padding,
    });

    currentResult = {
      ...computed,
      update,
    };
  };

  update();
  return {
    ...currentResult,
    update,
  };
}
