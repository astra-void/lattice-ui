import { type MotionTransition, React, Slot, useMotionTween } from "@lattice-ui/core";
import { useToggleGroupContext } from "./context";
import type { ToggleGroupItemProps } from "./types";

const ITEM_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const ITEM_EXIT_TWEEN_INFO = new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In);

const transition = {
  enter: {
    tweenInfo: ITEM_TWEEN_INFO,
    to: {
      BackgroundColor3: Color3.fromRGB(88, 142, 255),
    },
  },
  exit: {
    tweenInfo: ITEM_EXIT_TWEEN_INFO,
    to: {
      BackgroundColor3: Color3.fromRGB(47, 53, 68),
    },
  },
} satisfies MotionTransition;

export function ToggleGroupItem(props: ToggleGroupItemProps) {
  const toggleGroupContext = useToggleGroupContext();
  const disabled = toggleGroupContext.disabled || props.disabled === true;
  const pressed = toggleGroupContext.isPressed(props.value);
  const itemRef = React.useRef<TextButton>();

  useMotionTween(itemRef as React.MutableRefObject<Instance | undefined>, {
    active: pressed,
    transition,
  });

  const handleToggle = React.useCallback(() => {
    if (disabled) {
      return;
    }

    toggleGroupContext.toggleValue(props.value);
  }, [disabled, props.value, toggleGroupContext]);

  const handleInputBegan = React.useCallback(
    (_rbx: TextButton, inputObject: InputObject) => {
      if (disabled) {
        return;
      }

      const keyCode = inputObject.KeyCode;
      if (keyCode !== Enum.KeyCode.Return && keyCode !== Enum.KeyCode.Space) {
        return;
      }

      toggleGroupContext.toggleValue(props.value);
    },
    [disabled, props.value, toggleGroupContext],
  );

  const eventHandlers = React.useMemo(
    () => ({
      Activated: handleToggle,
      InputBegan: handleInputBegan,
    }),
    [handleInputBegan, handleToggle],
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToggleGroupItem] `asChild` requires a child element.");
    }

    return (
      <Slot Active={!disabled} Event={eventHandlers} Selectable={false}>
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active={!disabled}
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(47, 53, 68)}
      BorderSizePixel={0}
      Event={eventHandlers}
      Selectable={false}
      Size={UDim2.fromOffset(170, 34)}
      Text={props.value}
      TextColor3={disabled ? Color3.fromRGB(139, 146, 160) : Color3.fromRGB(236, 241, 249)}
      TextSize={15}
      ref={itemRef}
    >
      {props.children}
    </textbutton>
  );
}
