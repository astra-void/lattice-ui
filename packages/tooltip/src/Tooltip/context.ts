import { React, createStrictContext } from "@lattice-ui/core";
import type { TooltipContextValue, TooltipProviderContextValue } from "./types";

const [TooltipContextProvider, useTooltipContext] = createStrictContext<TooltipContextValue>("Tooltip");

const DEFAULT_TOOLTIP_PROVIDER_CONTEXT: TooltipProviderContextValue = {
  delayDuration: 700,
  skipDelayDuration: 300,
  resolveOpenDelay: (requestedDelay) => requestedDelay ?? 700,
  markOpen: () => {
    // default no-op
  },
};

const TooltipProviderContext = React.createContext<TooltipProviderContextValue>(DEFAULT_TOOLTIP_PROVIDER_CONTEXT);

function useTooltipProviderContext() {
  return React.useContext(TooltipProviderContext);
}

export { TooltipContextProvider, TooltipProviderContext, useTooltipContext, useTooltipProviderContext };
