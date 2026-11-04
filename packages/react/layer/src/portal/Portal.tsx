import { ReactRoblox } from "@lattice-ui/react-runtime";
import { portalContextMissing, useOptionalPortalContext } from "./context";
import type { PortalProps } from "./types";

export function Portal(props: PortalProps) {
  // Read non-strictly: an explicit `container` needs no PortalProvider. With neither, keep the
  // strict context error.
  const contextValue = useOptionalPortalContext();
  const target = props.container ?? contextValue?.container;
  if (target === undefined) {
    portalContextMissing();
  }

  return ReactRoblox.createPortal(props.children, target);
}
