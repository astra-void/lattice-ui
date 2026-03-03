import { React } from "@lattice-ui/core";
import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/layer";
import type { DialogPortalProps } from "./types";

function DialogPortalWithOverrides(props: DialogPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function DialogPortal(props: DialogPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <DialogPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </DialogPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
