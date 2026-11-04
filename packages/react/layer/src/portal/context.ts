import { React } from "@lattice-ui/react-runtime";
import type { PortalContextValue } from "./types";

const PortalContext = React.createContext<PortalContextValue | undefined>(undefined);

export const PortalContextProvider = PortalContext.Provider;

export function portalContextMissing(): never {
  error("[PortalProvider] context is undefined. Wrap components with <PortalProvider.Provider>.");
}

export function usePortalContext(): PortalContextValue {
  const contextValue = React.useContext(PortalContext);
  if (contextValue === undefined) {
    portalContextMissing();
  }

  return contextValue;
}

// Non-throwing read for callers that have their own fallback (Portal's `container` prop).
export function useOptionalPortalContext() {
  return React.useContext(PortalContext);
}
