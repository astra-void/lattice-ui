import { React, Slot } from "@lattice-ui/core";
import { useScrollAreaContext } from "./context";
import { resolveCanvasPositionFromTrackPosition, resolveThumbOffset, resolveThumbSize } from "./scrollMath";
import type { ScrollAreaScrollbarProps } from "./types";

function isPointerInput(inputObject: InputObject) {
  return (
    inputObject.UserInputType === Enum.UserInputType.MouseButton1 ||
    inputObject.UserInputType === Enum.UserInputType.Touch
  );
}

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  const scrollAreaContext = useScrollAreaContext();
  const scrollbarRef = React.useRef<GuiObject>();

  const vertical = props.orientation === "vertical";
  const visible = vertical ? scrollAreaContext.showVerticalScrollbar : scrollAreaContext.showHorizontalScrollbar;
  const axisMetrics = vertical ? scrollAreaContext.vertical : scrollAreaContext.horizontal;

  const setScrollbarRef = React.useCallback((instance: Instance | undefined) => {
    scrollbarRef.current = toGuiObject(instance);
  }, []);

  const handleInputBegan = React.useCallback(
    (rbx: GuiObject, inputObject: InputObject) => {
      if (!isPointerInput(inputObject) || axisMetrics.contentSize <= axisMetrics.viewportSize) {
        return;
      }

      const track = scrollbarRef.current ?? rbx;
      const trackSize = math.max(1, vertical ? track.AbsoluteSize.Y : track.AbsoluteSize.X);
      const trackStart = vertical ? track.AbsolutePosition.Y : track.AbsolutePosition.X;
      const pointerPosition = vertical ? inputObject.Position.Y : inputObject.Position.X;
      const trackPosition = pointerPosition - trackStart;
      const thumbSize = resolveThumbSize(axisMetrics.viewportSize, axisMetrics.contentSize, trackSize);
      const thumbOffset = resolveThumbOffset(
        axisMetrics.scrollPosition,
        axisMetrics.viewportSize,
        axisMetrics.contentSize,
        trackSize,
        thumbSize,
      );

      if (trackPosition >= thumbOffset && trackPosition <= thumbOffset + thumbSize) {
        return;
      }

      const nextCanvasPosition = resolveCanvasPositionFromTrackPosition(
        trackPosition,
        axisMetrics.viewportSize,
        axisMetrics.contentSize,
        trackSize,
        thumbSize,
      );

      scrollAreaContext.setScrollPosition(props.orientation, nextCanvasPosition);
    },
    [
      axisMetrics.contentSize,
      axisMetrics.scrollPosition,
      axisMetrics.viewportSize,
      props.orientation,
      scrollAreaContext,
      vertical,
    ],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ScrollAreaScrollbar] `asChild` requires a child element.");
    }

    return (
      <Slot Active={visible} Event={{ InputBegan: handleInputBegan }} Visible={visible} ref={setScrollbarRef}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      Active={visible}
      BackgroundColor3={Color3.fromRGB(44, 52, 67)}
      BorderSizePixel={0}
      Event={{ InputBegan: handleInputBegan }}
      Position={vertical ? UDim2.fromScale(1, 0) : UDim2.fromScale(0, 1)}
      Size={vertical ? UDim2.fromOffset(8, 160) : UDim2.fromOffset(260, 8)}
      Visible={visible}
      ref={setScrollbarRef}
    >
      {props.children}
    </frame>
  );
}
