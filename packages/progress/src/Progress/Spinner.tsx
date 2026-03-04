import { React, Slot } from "@lattice-ui/core";
import type { SpinnerProps } from "./types";

const RunService = game.GetService("RunService");

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
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
    if (!child) {
      error("[Spinner] `asChild` requires a child element.");
    }

    return (
      <Slot Visible={spinning} ref={setSpinnerRef}>
        {child}
      </Slot>
    );
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
      <uistroke Color={Color3.fromRGB(102, 156, 255)} Thickness={2} />
    </frame>
  );
}
