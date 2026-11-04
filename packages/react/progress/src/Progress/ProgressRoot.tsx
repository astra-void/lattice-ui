import { React } from "@lattice-ui/react-runtime";
import { ProgressContextProvider } from "./context";
import { clampProgressValue, resolveProgressMax, resolveProgressRatio } from "./math";
import type { ProgressProps } from "./types";

export function ProgressRoot(props: ProgressProps) {
  const max = resolveProgressMax(props.max);
  const indeterminate = props.indeterminate === true;

  // Progress is display-only: nothing inside it changes the value, so `value` drives it and
  // `defaultValue` is only read on mount.
  const [initialValue] = React.useState(() => props.defaultValue ?? 0);
  const value = props.value ?? initialValue;

  const clampedValue = clampProgressValue(value, max);
  const ratio = resolveProgressRatio(clampedValue, max, indeterminate);

  const contextValue = React.useMemo(
    () => ({
      value: clampedValue,
      max,
      ratio,
      indeterminate,
    }),
    [clampedValue, indeterminate, max, ratio],
  );

  return <ProgressContextProvider value={contextValue}>{props.children}</ProgressContextProvider>;
}

export { ProgressRoot as Progress };
