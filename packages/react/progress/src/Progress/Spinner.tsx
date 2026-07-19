import { composeRefs, getPassthroughProps, React, Slot, toSlotProps } from "@lattice-ui/react-runtime";
import type { SpinnerProps } from "./types";

const RunService = game.GetService("RunService");

const OWN_PROPS = ["spinning", "speedDegPerSecond", "asChild", "children"] as const;

// See ProgressIndicator: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
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

  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  const ref = composeRefs<GuiObject>(passthrough.ref as never, setSpinnerRef);
  const behaviorProps = {
    Visible: spinning,
  };

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[Spinner] `asChild` requires a child element.");
    }

    // No neutral defaults here: the rendered element belongs to the consumer.
    return (
      <Slot {...toSlotProps(passthrough)} {...behaviorProps} ref={ref as never}>
        {child}
      </Slot>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} {...behaviorProps} ref={ref}>
      {props.children}
    </frame>
  );
}
