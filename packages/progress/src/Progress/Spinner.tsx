import { composeRefs, getElementRef, React } from "@lattice-ui/core";
import type { SpinnerProps } from "./types";

const RunService = game.GetService("RunService");

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

export function Spinner(props: SpinnerProps) {
  const spinning = props.spinning ?? true;
  const speedDegPerSecond = props.speedDegPerSecond ?? 180;

  const spinnerRef = React.useRef<GuiObject>();

  const setSpinnerRef = React.useCallback((instance: Instance | undefined) => {
    spinnerRef.current = toGuiObject(instance);
  }, []);

  React.useEffect(() => {
    if (!spinning) {
      return;
    }

    const connection = RunService.Heartbeat.Connect((deltaSeconds) => {
      const spinner = spinnerRef.current;
      if (!spinner) {
        return;
      }

      spinner.Rotation += speedDegPerSecond * deltaSeconds;
    });

    return () => {
      connection.Disconnect();
    };
  }, [spinning, speedDegPerSecond]);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[Spinner] `asChild` requires a child element.");
    }

    const childProps = toGuiPropBag((child as { props?: unknown }).props);
    const childRef = getElementRef<Instance>(child);
    const mergedProps: GuiPropBag = {
      ...childProps,
      Visible: spinning,
      ref: composeRefs(childRef, setSpinnerRef),
    };

    return React.cloneElement(child as React.ReactElement<GuiPropBag>, mergedProps);
  }

  return (
    <frame
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Size={UDim2.fromOffset(22, 22)}
      Visible={spinning}
      ref={setSpinnerRef}
    >
      <uicorner CornerRadius={new UDim(1, 0)} />
      <uistroke Color={Color3.fromRGB(102, 156, 255)} Thickness={2} Transparency={0.35} />
      <frame
        AnchorPoint={new Vector2(0.5, 0.5)}
        BackgroundColor3={Color3.fromRGB(102, 156, 255)}
        BorderSizePixel={0}
        Position={UDim2.fromScale(0.5, 0.1)}
        Size={UDim2.fromOffset(4, 4)}
      >
        <uicorner CornerRadius={new UDim(1, 0)} />
      </frame>
    </frame>
  );
}
