import { React } from "@lattice-ui/core";
import { useStateMotion } from "@lattice-ui/motion";
import type { MotionConfig } from "@lattice-ui/motion";
import { useProgressContext } from "./context";
import type { ProgressIndicatorProps } from "./types";

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

const INDICATOR_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const progressContext = useProgressContext();

  const widthScale = progressContext.indeterminate ? 0.35 : progressContext.ratio;

  const indicatorRef = useStateMotion<Frame>(
    true,
    {
      entering: {
        tweenInfo: INDICATOR_TWEEN_INFO,
        goals: { Size: UDim2.fromScale(widthScale, 1) },
      },
      entered: {
        tweenInfo: INDICATOR_TWEEN_INFO,
        goals: { Size: UDim2.fromScale(widthScale, 1) },
      },
    } as MotionConfig,
    false,
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
      Size: UDim2.fromScale(0, 1), // Static, useMotionTween handles dynamic size
      ref: indicatorRef,
    };

    return React.cloneElement(child as React.ReactElement<GuiPropBag>, mergedProps);
  }

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(102, 156, 255)}
      BorderSizePixel={0}
      Position={UDim2.fromScale(0, 0)}
      Size={UDim2.fromScale(0, 1)} // Static, useMotionTween handles dynamic size
      ref={indicatorRef}
    >
      {props.children}
    </frame>
  );
}
