import { React } from "@lattice-ui/core";
import { GuiService } from "@rbxts/services";
import type { MotionPolicy } from "./types";

type MotionPolicyContextValue = MotionPolicy & { respectSystemReducedMotion: boolean };

const MotionPolicyContext = React.createContext<MotionPolicyContextValue>({
  disableAllMotion: false,
  mode: "full",
  respectSystemReducedMotion: true,
});

function readSystemReducedMotion(): boolean {
  const [ok, value] = pcall(() => GuiService.ReducedMotionEnabled);
  return ok && value === true;
}

export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(readSystemReducedMotion);

  React.useEffect(() => {
    setReduced(readSystemReducedMotion());

    let connection: RBXScriptConnection | undefined;
    pcall(() => {
      connection = GuiService.GetPropertyChangedSignal("ReducedMotionEnabled").Connect(() => {
        setReduced(readSystemReducedMotion());
      });
    });

    return () => {
      if (connection !== undefined) {
        connection.Disconnect();
      }
    };
  }, []);

  return reduced;
}

export function MotionProvider(props: {
  mode?: MotionPolicy["mode"];
  disableAllMotion?: boolean;
  respectSystemReducedMotion?: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo<MotionPolicyContextValue>(() => {
    const mode = props.disableAllMotion ? "none" : (props.mode ?? "full");
    return {
      mode,
      disableAllMotion: mode === "none",
      respectSystemReducedMotion: props.respectSystemReducedMotion ?? true,
    };
  }, [props.disableAllMotion, props.mode, props.respectSystemReducedMotion]);

  return <MotionPolicyContext.Provider value={value}>{props.children}</MotionPolicyContext.Provider>;
}

export function useMotionPolicy(): MotionPolicy {
  const ctx = React.useContext(MotionPolicyContext);
  const systemReducedMotion = useSystemReducedMotion();

  return React.useMemo<MotionPolicy>(() => {
    const disableAllMotion = ctx.disableAllMotion || (ctx.respectSystemReducedMotion && systemReducedMotion);
    return {
      mode: disableAllMotion ? "none" : ctx.mode,
      disableAllMotion,
    };
  }, [ctx.disableAllMotion, ctx.mode, ctx.respectSystemReducedMotion, systemReducedMotion]);
}
