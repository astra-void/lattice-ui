import { React, useControllableState } from "@lattice-ui/core";
import { ProgressContextProvider } from "./context";
import { clampProgressValue, resolveProgressRatio } from "./math";
import type { ProgressProps } from "./types";

export function ProgressRoot(props: ProgressProps) {
  const max = math.max(1, props.max ?? 100);
  const indeterminate = props.indeterminate === true;

  const [value] = useControllableState<number>({
    value: props.value,
    defaultValue: props.defaultValue ?? 0,
    onChange: props.onValueChange,
  });

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
