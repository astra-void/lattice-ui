import { React } from "@lattice-ui/core";
import { TooltipProviderContext } from "./context";
import type { TooltipProviderContextValue, TooltipProviderProps } from "./types";

export function TooltipProvider(props: TooltipProviderProps) {
  const delayDuration = props.delayDuration ?? 700;
  const skipDelayDuration = props.skipDelayDuration ?? 300;
  const lastOpenTimestampRef = React.useRef<number>();

  const markOpen = React.useCallback(() => {
    lastOpenTimestampRef.current = os.clock();
  }, []);

  const resolveOpenDelay = React.useCallback(
    (requestedDelay?: number) => {
      const baseDelay = requestedDelay ?? delayDuration;
      const lastOpenTimestamp = lastOpenTimestampRef.current;
      if (lastOpenTimestamp === undefined) {
        return baseDelay;
      }

      const elapsedMs = (os.clock() - lastOpenTimestamp) * 1000;
      if (elapsedMs <= skipDelayDuration) {
        return math.min(baseDelay, skipDelayDuration);
      }

      return baseDelay;
    },
    [delayDuration, skipDelayDuration],
  );

  const contextValue = React.useMemo<TooltipProviderContextValue>(
    () => ({
      delayDuration,
      skipDelayDuration,
      resolveOpenDelay,
      markOpen,
    }),
    [delayDuration, markOpen, resolveOpenDelay, skipDelayDuration],
  );

  return <TooltipProviderContext.Provider value={contextValue}>{props.children}</TooltipProviderContext.Provider>;
}
