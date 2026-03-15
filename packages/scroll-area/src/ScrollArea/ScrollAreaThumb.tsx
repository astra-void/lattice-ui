import { React, Slot } from "@lattice-ui/core";
import { useScrollAreaContext } from "./context";
import {
  resolveCanvasPositionFromThumbOffset,
  resolveThumbOffset,
  resolveThumbOffsetFromPointerDelta,
  resolveThumbSize,
} from "./scrollMath";
import type { ScrollAreaThumbProps } from "./types";

const UserInputService = game.GetService("UserInputService");

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
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const scrollAreaContext = useScrollAreaContext();
  const vertical = props.orientation === "vertical";
  const thumbRef = React.useRef<GuiObject>();
  const dragStateRef = React.useRef<DragState>();

  const axisMetrics = vertical ? scrollAreaContext.vertical : scrollAreaContext.horizontal;
  const trackSize = math.max(1, axisMetrics.viewportSize);
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
    if (!parent || !parent.IsA("GuiObject")) {
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

      scrollAreaContext.setScrollPosition(props.orientation, nextCanvasPosition);
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
  }, [axisMetrics.contentSize, axisMetrics.viewportSize, getTrack, props.orientation, scrollAreaContext, vertical]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ScrollAreaThumb] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active={axisMetrics.contentSize > axisMetrics.viewportSize}
        Event={{ InputBegan: handleInputBegan }}
        Position={vertical ? UDim2.fromScale(0, offsetScale) : UDim2.fromScale(offsetScale, 0)}
        Size={vertical ? UDim2.fromScale(1, sizeScale) : UDim2.fromScale(sizeScale, 1)}
        ref={setThumbRef}
      >
        {child}
      </Slot>
    );
  }

  return (
    <frame
      Active={axisMetrics.contentSize > axisMetrics.viewportSize}
      BackgroundColor3={Color3.fromRGB(118, 128, 149)}
      BorderSizePixel={0}
      Event={{ InputBegan: handleInputBegan }}
      Position={vertical ? UDim2.fromScale(0, offsetScale) : UDim2.fromScale(offsetScale, 0)}
      Size={vertical ? UDim2.fromScale(1, sizeScale) : UDim2.fromScale(sizeScale, 1)}
      ref={setThumbRef}
    >
      <uicorner CornerRadius={new UDim(1, 0)} />
      {props.children}
    </frame>
  );
}
