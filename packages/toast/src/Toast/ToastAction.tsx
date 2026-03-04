import { React, Slot } from "@lattice-ui/core";
import type { ToastActionProps } from "./types";

export function ToastAction(props: ToastActionProps) {
  const handleActivated = React.useCallback(() => {
    props.onAction?.();
  }, [props]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastAction] `asChild` requires a child element.");
    }

    return (
      <Slot
        Active
        Event={{
          Activated: handleActivated,
        }}
        Selectable
      >
        {child}
      </Slot>
    );
  }

  return (
    <textbutton
      Active
      AutoButtonColor={false}
      BackgroundColor3={Color3.fromRGB(58, 66, 84)}
      BorderSizePixel={0}
      Event={{
        Activated: handleActivated,
      }}
      Selectable
      Size={UDim2.fromOffset(88, 26)}
      Text="Action"
      TextColor3={Color3.fromRGB(235, 240, 248)}
      TextSize={13}
    >
      {props.children}
    </textbutton>
  );
}
