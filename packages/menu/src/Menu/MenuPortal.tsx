import { React } from "@lattice-ui/core";
import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/layer";
import type { MenuPortalProps } from "./types";

function MenuPortalWithOverrides(props: MenuPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function MenuPortal(props: MenuPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <MenuPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </MenuPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
