import { React, Slot } from "@lattice-ui/core";
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
    createSliderThumbResponseRecipe(sliderContext.isDragging, sliderContext.isDragging ? 0.03 : 0.04),
  );

  const setNodeRef = React.useCallback(
    (instance: Instance | undefined) => {
      const nextThumb = !instance?.IsA("GuiObject") ? undefined : instance;
      motionRef.current = nextThumb;
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

      if (keyCode === Enum.KeyCode.Home) {
        nextValue = sliderContext.min;
      } else if (keyCode === Enum.KeyCode.End) {
        nextValue = sliderContext.max;
      } else if (keyCode === Enum.KeyCode.PageUp) {
        nextValue = sliderContext.value + pageStep;
      } else if (keyCode === Enum.KeyCode.PageDown) {
        nextValue = sliderContext.value - pageStep;
      } else if (keyCode === Enum.KeyCode.Right || keyCode === Enum.KeyCode.Up) {
        nextValue = sliderContext.value + sliderContext.step;
      } else if (keyCode === Enum.KeyCode.Left || keyCode === Enum.KeyCode.Down) {
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
    [sliderContext],
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
