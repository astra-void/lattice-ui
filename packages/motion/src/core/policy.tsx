import { React } from "@lattice-ui/core";
import type { MotionPolicy } from "./types";

const MotionPolicyContext = React.createContext<MotionPolicy>({ disableAllMotion: false, mode: "full" });

export function MotionProvider(props: {
  mode?: MotionPolicy["mode"];
  disableAllMotion?: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo<MotionPolicy>(() => {
    const mode = props.disableAllMotion ? "none" : (props.mode ?? "full");
    return {
      mode,
      disableAllMotion: mode === "none",
    };
  }, [props.disableAllMotion, props.mode]);

  return <MotionPolicyContext.Provider value={value}>{props.children}</MotionPolicyContext.Provider>;
}

export function useMotionPolicy() {
  return React.useContext(MotionPolicyContext);
}
