import { React, Slot } from "@lattice-ui/core";
import { useSliderContext } from "./context";
import type { SliderTrackProps } from "./types";

function isPointerStartInput(inputObject: InputObject) {
  return (
    inputObject.UserInputType === Enum.UserInputType.MouseButton1 ||
    inputObject.UserInputType === Enum.UserInputType.Touch
  );
}

export function SliderTrack(props: SliderTrackProps) {
  const sliderContext = useSliderContext();

  const handleInputBegan = React.useCallback(
    (_rbx: GuiObject, inputObject: InputObject) => {
      if (!isPointerStartInput(inputObject)) {
        return;
      }

      sliderContext.startDrag(inputObject);
    },
    [sliderContext],
  );

  const sharedProps = {
    Active: !sliderContext.disabled,
    Name: "SliderTrack",
    Selectable: !sliderContext.disabled,
    Event: {
      InputBegan: handleInputBegan,
    },
    ref: sliderContext.setTrackNode,
  };

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[SliderTrack] `asChild` requires a child element.");
    }

    return <Slot {...sharedProps}>{child}</Slot>;
  }

  return (
    <frame
      {...sharedProps}
      BackgroundColor3={Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Size={sliderContext.orientation === "horizontal" ? UDim2.fromOffset(260, 10) : UDim2.fromOffset(10, 220)}
    >
      {props.children}
    </frame>
  );
}
