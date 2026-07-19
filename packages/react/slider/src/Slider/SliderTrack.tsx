import { composeEvents, composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import { useSliderContext } from "./context";
import type { SliderTrackProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// Roblox instance defaults are themselves a look: a bare `frame` renders an opaque grey box.
// Neutralize only that, and leave every real appearance decision (colors, size, corners) to the
// consumer. Passthrough props are spread after these, so they stay overridable.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

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

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  // The track instance is measured to convert pointer position into a value, so its ref must reach
  // the slider even when the consumer forwards one of their own.
  const ref = composeRefs<GuiObject>(passthrough.ref as never, sliderContext.setTrackNode);
  const behaviorProps = {
    Active: !sliderContext.disabled,
    Event: composeEvents(passthrough.Event, { InputBegan: handleInputBegan }),
    Selectable: !sliderContext.disabled,
  };

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[SliderTrack] `asChild` requires a child element.");
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
