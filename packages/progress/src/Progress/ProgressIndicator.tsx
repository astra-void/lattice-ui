import { React } from "@lattice-ui/core";
import { useProgressContext } from "./context";
import type { ProgressIndicatorProps } from "./types";

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const progressContext = useProgressContext();

  const widthScale = progressContext.indeterminate ? 0.35 : progressContext.ratio;

  if (props.asChild) {
    const child = props.children;
    if (!child) {
      error("[ProgressIndicator] `asChild` requires a child element.");
    }

    const childProps = toGuiPropBag((child as { props?: unknown }).props);
    const mergedProps: GuiPropBag = {
      ...childProps,
      Position: UDim2.fromScale(0, 0),
      Size: UDim2.fromScale(widthScale, 1),
    };

    return React.cloneElement(child as React.ReactElement<GuiPropBag>, mergedProps);
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(102, 156, 255)}
      BorderSizePixel={0}
      Position={UDim2.fromScale(0, 0)}
      Size={UDim2.fromScale(widthScale, 1)}
    >
      {props.children}
    </frame>
  );
}
