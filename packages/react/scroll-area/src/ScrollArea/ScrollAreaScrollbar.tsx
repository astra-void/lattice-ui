import {
  composeEvents,
  composeRefs,
  getPassthroughProps,
  getSlotChild,
  React,
  Slot,
  toSlotProps,
} from "@lattice-ui/react-runtime";
import { useScrollAreaContext } from "./context";
import { resolveCanvasPositionFromTrackPosition, resolveThumbOffset, resolveThumbSize } from "./scrollMath";
import type { ScrollAreaScrollbarProps } from "./types";

const OWN_PROPS = ["orientation", "asChild", "children"] as const;

// Only the Roblox instance defaults are neutralized: where the bar sits, how wide it is and what it
// looks like are the consumer's decisions. Passthrough props are spread after these.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

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
      scrollAreaContext.setScrollPosition,
      vertical,
    ],
  );

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  // The bar instance is measured to turn a click into a canvas position, so its ref must reach this
  // primitive even when the consumer forwards one of their own.
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setScrollbarRef);
  const behaviorProps = {
    Active: visible,
    Event: composeEvents(passthrough.Event, { InputBegan: handleInputBegan }),
    Visible: visible,
  };

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[ScrollAreaScrollbar] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref}>
      {props.children}
    </frame>
  );
}
