import { React } from "@lattice-ui/core";
import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/layer";
import type { PopoverPortalProps } from "./types";

function PopoverPortalWithOverrides(props: PopoverPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function PopoverPortal(props: PopoverPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <PopoverPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </PopoverPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
