import { React } from "@lattice-ui/core";
import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/layer";
import type { SelectPortalProps } from "./types";

function SelectPortalWithOverrides(props: SelectPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function SelectPortal(props: SelectPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <SelectPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </SelectPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
