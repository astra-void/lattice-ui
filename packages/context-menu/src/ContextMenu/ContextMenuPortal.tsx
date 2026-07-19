import { React } from "@lattice-ui/core";
import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/layer";
import type { ContextMenuPortalProps } from "./types";

function ContextMenuPortalWithOverrides(props: ContextMenuPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function ContextMenuPortal(props: ContextMenuPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <ContextMenuPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </ContextMenuPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
