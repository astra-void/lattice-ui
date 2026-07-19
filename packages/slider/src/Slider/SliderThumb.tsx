import { React, Slot } from "@lattice-ui/core";
import { useFocusNode } from "@lattice-ui/focus";
import { createSliderThumbResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useSliderContext } from "./context";
import { valueToPercent } from "./internals/math";
import type { SliderThumbProps } from "./types";

function isPointerStartInput(inputObject: InputObject) {
  return (
    inputObject.UserInputType === Enum.UserInputType.MouseButton1 ||
    inputObject.UserInputType === Enum.UserInputType.Touch
  );
}

export function SliderThumb(props: SliderThumbProps) {
  const sliderContext = useSliderContext();
  const percent = valueToPercent(sliderContext.value, sliderContext.min, sliderContext.max);

  const position =
    sliderContext.orientation === "horizontal" ? UDim2.fromScale(percent, 0.5) : UDim2.fromScale(0.5, 1 - percent);

  const motionRef = useResponseMotion<GuiObject>(
    true,
    { active: { Position: position }, inactive: { Position: position } },
    createSliderThumbResponseRecipe(sliderContext.isDragging),
  );

  const isHorizontal = sliderContext.orientation === "horizontal";

  const focusRef = React.useRef<GuiObject>();
  useFocusNode({
    ref: focusRef,
    disabled: sliderContext.disabled,
    // Arrow keys along the value axis adjust the slider, so the navigation
    // controller passes them through; cross-axis directions move focus away.
    getCapturesDirectional: (direction) =>
      isHorizontal ? direction === "left" || direction === "right" : direction === "up" || direction === "down",
  });

  const setNodeRef = React.useCallback(
    (instance: Instance | undefined) => {
      const nextThumb = !instance?.IsA("GuiObject") ? undefined : instance;
      motionRef.current = nextThumb;
      focusRef.current = nextThumb;
      sliderContext.setThumbNode(nextThumb);
    },
    [motionRef, sliderContext],
  );

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (isPointerStartInput(inputObject)) {
        sliderContext.startDrag(inputObject);
        return;
      }

      if (sliderContext.disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      let nextValue: number | undefined;
      const pageStep = sliderContext.step * 10;

      // Only the value axis adjusts the slider; the cross axis is left for the
      // navigation controller to move focus away from the thumb.
      const incrementKey = isHorizontal ? Enum.KeyCode.Right : Enum.KeyCode.Up;
      const decrementKey = isHorizontal ? Enum.KeyCode.Left : Enum.KeyCode.Down;

      if (keyCode === Enum.KeyCode.Home) {
        nextValue = sliderContext.min;
      } else if (keyCode === Enum.KeyCode.End) {
        nextValue = sliderContext.max;
      } else if (keyCode === Enum.KeyCode.PageUp) {
        nextValue = sliderContext.value + pageStep;
      } else if (keyCode === Enum.KeyCode.PageDown) {
        nextValue = sliderContext.value - pageStep;
      } else if (keyCode === incrementKey) {
        nextValue = sliderContext.value + sliderContext.step;
      } else if (keyCode === decrementKey) {
        nextValue = sliderContext.value - sliderContext.step;
      } else if (keyCode === Enum.KeyCode.Return || keyCode === Enum.KeyCode.Space) {
        sliderContext.commitValue(sliderContext.value);
        return;
      } else {
        return;
      }

      if (nextValue === undefined) {
        return;
      }

      sliderContext.setValue(nextValue);
      sliderContext.commitValue(nextValue);
    },
    [isHorizontal, sliderContext],
  );

  const sharedProps = {
    Active: !sliderContext.disabled,
    AnchorPoint: new Vector2(0.5, 0.5),
    Name: "SliderThumb",
    Selectable: !sliderContext.disabled,
    Event: {
      InputBegan: handleInputBegan,
    },
    ref: setNodeRef,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SliderThumb] `asChild` requires a child element.");
    }

    return <Slot {...sharedProps}>{child}</Slot>;
  }

  return (
    <textbutton
      {...sharedProps}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(235, 241, 250)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(16, 16)}
      Text=""
    >
      {props.children}
    </textbutton>
  );
}
