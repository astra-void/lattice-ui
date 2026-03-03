import { React, Slot } from "@lattice-ui/core";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const visible = switchContext.checked;
  const forceMount = props.forceMount === true;

  if (!visible && !forceMount) {
    return undefined;
  }

  const child = props.children;

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(16, 16)}
      Visible={visible}
    >
      {child}
    </frame>
  );
}
