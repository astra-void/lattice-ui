import { React } from "@lattice-ui/core";
import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/layer";
import type { TooltipPortalProps } from "./types";

function TooltipPortalWithOverrides(props: TooltipPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function TooltipPortal(props: TooltipPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <TooltipPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </TooltipPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
