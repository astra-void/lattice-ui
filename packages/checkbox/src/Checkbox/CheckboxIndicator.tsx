import { React, Slot } from "@lattice-ui/core";
import { useCheckboxContext } from "./context";
import type { CheckboxIndicatorProps } from "./types";

export function CheckboxIndicator(props: CheckboxIndicatorProps) {
  const checkboxContext = useCheckboxContext();
  const visible = checkboxContext.checked !== false;
  const forceMount = props.forceMount === true;

  if (!visible && !forceMount) {
    return undefined;
  }

  const child = props.children;

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[CheckboxIndicator] `asChild` requires a child element.");
    }

    return <Slot Visible={visible}>{child}</Slot>;
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(240, 244, 252)}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(12, 12)}
      Visible={visible}
    >
      {child}
    </frame>
  );
}
