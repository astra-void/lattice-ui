import { React, Slot } from "@lattice-ui/core";
import { useRadioGroupItemContext } from "./context";
import type { RadioGroupIndicatorProps } from "./types";

export function RadioGroupIndicator(props: RadioGroupIndicatorProps) {
  const radioGroupItemContext = useRadioGroupItemContext();
  const visible = radioGroupItemContext.checked;
  const forceMount = props.forceMount === true;

  if (!visible && !forceMount) {
    return undefined;
  }

  const child = props.children;

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[RadioGroupIndicator] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(10, 10)}
      Visible={visible}
    >
      {child}
    </frame>
  );
}
