import { React, Slot } from "@lattice-ui/core";
import { useProgressContext } from "./context";
import type { ProgressIndicatorProps } from "./types";

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const progressContext = useProgressContext();

  const widthScale = progressContext.indeterminate ? 0.35 : progressContext.ratio;
  const xScale = progressContext.indeterminate ? 0 : 0;

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ProgressIndicator] `asChild` requires a child element.");
    }

    return (
      <Slot Position={UDim2.fromScale(xScale, 0)} Size={UDim2.fromScale(widthScale, 1)}>
        {child}
      </Slot>
    );
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(102, 156, 255)}
      BorderSizePixel={0}
      Position={UDim2.fromScale(xScale, 0)}
      Size={UDim2.fromScale(widthScale, 1)}
    >
      {props.children}
    </frame>
  );
}
