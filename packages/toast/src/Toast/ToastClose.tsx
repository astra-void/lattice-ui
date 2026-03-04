import { React, Slot } from "@lattice-ui/core";
import type { ToastCloseProps } from "./types";

export function ToastClose(props: ToastCloseProps) {
  const handleActivated = React.useCallback(() => {
    props.onClose?.();
  }, [props]);

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ToastClose] `asChild` requires a child element.");
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
      Size={UDim2.fromOffset(26, 26)}
      Text="X"
      TextColor3={Color3.fromRGB(235, 240, 248)}
      TextSize={13}
    />
  );
}
