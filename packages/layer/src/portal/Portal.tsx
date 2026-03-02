import { ReactRoblox } from "@lattice-ui/core";
import { usePortalContext } from "./PortalProvider";
import type { PortalProps } from "./types";

export function Portal(props: PortalProps) {
  const contextValue = usePortalContext();
  const target = props.container ?? contextValue.container;
  return ReactRoblox.createPortal(props.children, target);
}
