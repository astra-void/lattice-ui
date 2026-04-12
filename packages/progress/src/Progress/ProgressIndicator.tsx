import { composeRefs, React } from "@lattice-ui/core";
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
    if (!React.isValidElement(child)) {
      error("[ProgressIndicator] `asChild` requires a child element.");
    }

    const childProps = toGuiPropBag((child as { props?: unknown }).props);
    const mergedChildProps: GuiPropBag = {
      ...childProps,
      Position: UDim2.fromScale(0, 0),
      Size: UDim2.fromScale(1, 1),
      ref: composeRefs((childProps as { ref?: React.Ref<Instance> }).ref),
    };

    return (
      <frame
        BackgroundTransparency={1}
        BorderSizePixel={0}
        ClipsDescendants={true}
        Position={UDim2.fromScale(0, 0)}
        Size={UDim2.fromScale(0, 1)}
        ref={indicatorRef}
      >
        {React.cloneElement(child as React.ReactElement<GuiPropBag>, mergedChildProps)}
      </frame>
    );
  }

  return (
    <frame
      BackgroundTransparency={1}
      BorderSizePixel={0}
      ClipsDescendants={true}
      Position={UDim2.fromScale(0, 0)}
      Size={UDim2.fromScale(0, 1)}
      ref={indicatorRef}
    >
      <frame BackgroundColor3={Color3.fromRGB(102, 156, 255)} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
        {props.children}
      </frame>
    </frame>
  );
}
