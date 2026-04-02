import { type MotionTransition, React, useMotionTween } from "@lattice-ui/core";
import { useProgressContext } from "./context";
import type { ProgressIndicatorProps } from "./types";

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

const INDICATOR_TWEEN_INFO = new TweenInfo(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const progressContext = useProgressContext();
  const indicatorRef = React.useRef<Frame>();

  const widthScale = progressContext.indeterminate ? 0.35 : progressContext.ratio;

  const transition = React.useMemo<MotionTransition>(() => {
    return {
      enter: {
        tweenInfo: INDICATOR_TWEEN_INFO,
        to: {
          Size: UDim2.fromScale(widthScale, 1),
        },
      },
    };
  }, [widthScale]);

  useMotionTween(indicatorRef as React.MutableRefObject<Instance | undefined>, {
    active: true,
    transition,
  });

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
