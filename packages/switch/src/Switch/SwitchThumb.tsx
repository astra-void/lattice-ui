import { React, Slot } from "@lattice-ui/core";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const child = props.children;

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    return <Slot>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Position={switchContext.checked ? new UDim2(1, -18, 0, 2) : UDim2.fromOffset(2, 2)}
      Size={UDim2.fromOffset(16, 16)}
    >
      {child}
    </frame>
  );
}
