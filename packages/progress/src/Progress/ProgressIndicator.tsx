import { React } from "@lattice-ui/core";
import { createProgressResponseRecipe, useResponseMotion } from "@lattice-ui/motion";
import { useProgressContext } from "./context";
import type { ProgressIndicatorProps } from "./types";

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const progressContext = useProgressContext();

  const widthScale = progressContext.indeterminate ? 0.35 : progressContext.ratio;

  // Always active for ProgressIndicator, it just animates Size when ratio changes
  const indicatorRef = useResponseMotion<Frame>(
    true,
    {
      active: { Size: UDim2.fromScale(widthScale, 1) },
      inactive: { Size: UDim2.fromScale(widthScale, 1) },
    },
    props.transition ?? createProgressResponseRecipe(),
  );

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ProgressIndicator] `asChild` requires a child element.");
    }

    const childProps = toGuiPropBag((child as { props?: unknown }).props);
    const mergedProps: GuiPropBag = {
      ...childProps,
      Position: UDim2.fromScale(0, 0),
      Size: UDim2.fromScale(0, 1), // Static, useResponseMotion handles dynamic size
      ref: indicatorRef,
    };

    return React.cloneElement(child as React.ReactElement<GuiPropBag>, mergedProps);
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(102, 156, 255)}
      BorderSizePixel={0}
      Position={UDim2.fromScale(0, 0)}
      Size={UDim2.fromScale(0, 1)} // Static, useResponseMotion handles dynamic size
      ref={indicatorRef}
    >
      {props.children}
    </frame>
  );
}
