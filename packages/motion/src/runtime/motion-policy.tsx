import { React } from "@lattice-ui/core";

export type MotionPolicyValue = {
  disableAllMotion: boolean;
};

const MotionPolicyContext = React.createContext<MotionPolicyValue>({
  disableAllMotion: false,
});

export type MotionPolicyProviderProps = {
  disableAllMotion?: boolean;
  children?: React.ReactNode;
};

export function MotionPolicyProvider(props: MotionPolicyProviderProps) {
  const value = React.useMemo(() => ({ disableAllMotion: props.disableAllMotion ?? false }), [props.disableAllMotion]);

  return <MotionPolicyContext.Provider value={value}>{props.children}</MotionPolicyContext.Provider>;
}

export function useMotionPolicy() {
  return React.useContext(MotionPolicyContext);
}
