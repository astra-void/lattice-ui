import { React } from "@lattice-ui/core";

import type { MotionPolicyProviderProps, MotionPolicyValue } from "./types";

const MotionPolicyContext = React.createContext<MotionPolicyValue>({
  disableAllMotion: false,
});

export function MotionPolicyProvider(props: MotionPolicyProviderProps) {
  const value = React.useMemo<MotionPolicyValue>(
    () => ({
      disableAllMotion: props.disableAllMotion === true,
    }),
    [props.disableAllMotion],
  );

  return <MotionPolicyContext.Provider value={value}>{props.children}</MotionPolicyContext.Provider>;
}

export function useMotionPolicy() {
  return React.useContext(MotionPolicyContext);
}
