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
import {
  resolveCanvasPositionFromThumbOffset,
  resolveThumbOffset,
  resolveThumbOffsetFromPointerDelta,
  resolveThumbSize,
} from "./scrollMath";
import type { ScrollAreaThumbProps } from "./types";

const UserInputService = game.GetService("UserInputService");

const OWN_PROPS = ["orientation", "asChild", "children"] as const;

// Only the Roblox instance defaults are neutralized; the thumb's look is the consumer's decision.
// Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

type DragState = {
  inputType: Enum.UserInputType;
  pointerStart: number;
  thumbOffsetStart: number;
};

function isThumbDragStart(inputObject: InputObject) {
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

export const ScrollAreaThumb = React.forwardRef<Frame, ScrollAreaThumbProps>((props, forwardedRef) => {
  const scrollAreaContext = useScrollAreaContext();
  const vertical = props.orientation === "vertical";
  const thumbRef = React.useRef<GuiObject>();
  const dragStateRef = React.useRef<DragState>();

  // The thumb's Size/Position are scales of its track (its parent), so they are computed against the
  // track's measured length, the same length the drag and track-click math read. The viewport length
  // is only a fallback until the track has been laid out.
  const [thumbInstance, setThumbInstance] = React.useState<GuiObject>();
  const [measuredTrackSize, setMeasuredTrackSize] = React.useState(0);

  // The composed ref changes identity every render, so the thumb is picked up here rather than by
  // setting state from the ref callback.
  React.useEffect(() => {
    if (thumbRef.current !== thumbInstance) {
      setThumbInstance(thumbRef.current);
    }
  });

  React.useEffect(() => {
    const thumb = thumbInstance;
    if (!thumb) {
      setMeasuredTrackSize(0);
      return;
    }

    let sizeConnection: RBXScriptConnection | undefined;
    const bindTrack = () => {
      sizeConnection?.Disconnect();
      sizeConnection = undefined;

      const track = thumb.Parent;
      if (!track?.IsA("GuiObject")) {
        setMeasuredTrackSize(0);
        return;
      }

      const measure = () => setMeasuredTrackSize(vertical ? track.AbsoluteSize.Y : track.AbsoluteSize.X);
      sizeConnection = track.GetPropertyChangedSignal("AbsoluteSize").Connect(measure);
      measure();
    };

    bindTrack();
    const parentConnection = thumb.GetPropertyChangedSignal("Parent").Connect(bindTrack);

    return () => {
      parentConnection.Disconnect();
      sizeConnection?.Disconnect();
    };
  }, [thumbInstance, vertical]);

  const axisMetrics = vertical ? scrollAreaContext.vertical : scrollAreaContext.horizontal;
  const trackSize = math.max(1, measuredTrackSize > 0 ? measuredTrackSize : axisMetrics.viewportSize);
  const thumbSize = resolveThumbSize(axisMetrics.viewportSize, axisMetrics.contentSize, trackSize);
  const thumbOffset = resolveThumbOffset(
    axisMetrics.scrollPosition,
    axisMetrics.viewportSize,
    axisMetrics.contentSize,
    trackSize,
    thumbSize,
  );

  const sizeScale = trackSize > 0 ? thumbSize / trackSize : 1;
  const offsetScale = trackSize > 0 ? thumbOffset / trackSize : 0;

  const setThumbRef = React.useCallback((instance: Instance | undefined) => {
    thumbRef.current = toGuiObject(instance);
  }, []);

  const getTrack = React.useCallback(() => {
    const thumb = thumbRef.current;
    const parent = thumb?.Parent;
    if (!parent?.IsA("GuiObject")) {
      return undefined;
    }

    return parent;
  }, []);

  const handleInputBegan = React.useCallback(
    (rbx: GuiObject, inputObject: InputObject) => {
      if (!isThumbDragStart(inputObject) || axisMetrics.contentSize <= axisMetrics.viewportSize) {
        return;
      }

      const track = getTrack();
      if (!track) {
        return;
      }

      const actualTrackSize = math.max(1, vertical ? track.AbsoluteSize.Y : track.AbsoluteSize.X);
      const actualThumbSize = resolveThumbSize(axisMetrics.viewportSize, axisMetrics.contentSize, actualTrackSize);
      const actualThumbOffset = resolveThumbOffset(
        axisMetrics.scrollPosition,
        axisMetrics.viewportSize,
        axisMetrics.contentSize,
        actualTrackSize,
        actualThumbSize,
      );

      dragStateRef.current = {
        inputType: inputObject.UserInputType,
        pointerStart: vertical ? inputObject.Position.Y : inputObject.Position.X,
        thumbOffsetStart: actualThumbOffset,
      };

      if (rbx.IsA("GuiButton")) {
        rbx.AutoButtonColor = false;
      }
    },
    [axisMetrics.contentSize, axisMetrics.scrollPosition, axisMetrics.viewportSize, getTrack, vertical],
  );

  // The drag listeners are global and only need the latest metrics/handlers at
  // the moment input fires. Reading them through a ref keeps the effect deps
  // stable, so we subscribe once instead of re-subscribing on every scroll
  // (metrics change continuously while scrolling).
  const dragInputRef = React.useRef({
    axisMetrics,
    getTrack,
    vertical,
    orientation: props.orientation,
    setScrollPosition: scrollAreaContext.setScrollPosition,
  });
  dragInputRef.current = {
    axisMetrics,
    getTrack,
    vertical,
    orientation: props.orientation,
    setScrollPosition: scrollAreaContext.setScrollPosition,
  };

  React.useEffect(() => {
    const inputChangedConnection = UserInputService.InputChanged.Connect((inputObject) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const isMatchingInput =
        dragState.inputType === Enum.UserInputType.Touch
          ? inputObject.UserInputType === Enum.UserInputType.Touch
          : inputObject.UserInputType === Enum.UserInputType.MouseMovement;

      if (!isMatchingInput) {
        return;
      }

      const { axisMetrics, getTrack, vertical, orientation, setScrollPosition } = dragInputRef.current;

      const track = getTrack();
      if (!track) {
        return;
      }

      const actualTrackSize = math.max(1, vertical ? track.AbsoluteSize.Y : track.AbsoluteSize.X);
      const actualThumbSize = resolveThumbSize(axisMetrics.viewportSize, axisMetrics.contentSize, actualTrackSize);
      const pointerPosition = vertical ? inputObject.Position.Y : inputObject.Position.X;
      const thumbOffset = resolveThumbOffsetFromPointerDelta(
        dragState.thumbOffsetStart,
        pointerPosition - dragState.pointerStart,
        actualTrackSize,
        actualThumbSize,
      );

      const nextCanvasPosition = resolveCanvasPositionFromThumbOffset(
        thumbOffset,
        axisMetrics.viewportSize,
        axisMetrics.contentSize,
        actualTrackSize,
        actualThumbSize,
      );

      setScrollPosition(orientation, nextCanvasPosition);
    });

    const inputEndedConnection = UserInputService.InputEnded.Connect((inputObject) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      if (dragState.inputType === Enum.UserInputType.Touch && inputObject.UserInputType === Enum.UserInputType.Touch) {
        dragStateRef.current = undefined;
      }

      if (
        dragState.inputType === Enum.UserInputType.MouseButton1 &&
        inputObject.UserInputType === Enum.UserInputType.MouseButton1
      ) {
        dragStateRef.current = undefined;
      }
    });

    return () => {
      inputChangedConnection.Disconnect();
      inputEndedConnection.Disconnect();
    };
  }, []);

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS, forwardedRef);
  // The thumb instance is read back to find its track, so its ref must reach this primitive even
  // when the consumer forwards one of their own.
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setThumbRef);
  // Position/Size are the scroll ratio, not decoration; spread after passthrough so they win.
  const behaviorProps = {
    Active: axisMetrics.contentSize > axisMetrics.viewportSize,
    Event: composeEvents(passthrough.Event, { InputBegan: handleInputBegan }),
    Position: vertical ? UDim2.fromScale(0, offsetScale) : UDim2.fromScale(offsetScale, 0),
    Size: vertical ? UDim2.fromScale(1, sizeScale) : UDim2.fromScale(sizeScale, 1),
  };

  if (props.asChild) {
    const child = props.children;
    if (getSlotChild(child) === undefined) {
      error("[ScrollAreaThumb] `asChild` requires a child element.");
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
});
ScrollAreaThumb.displayName = "ScrollAreaThumb";
