import { Portal, PortalProvider, usePortalContext } from "@lattice-ui/react-layer";
import { React } from "@lattice-ui/react-runtime";
import type { ComboboxPortalProps } from "./types";

function ComboboxPortalWithOverrides(props: ComboboxPortalProps) {
  const portalContext = usePortalContext();
  const container = props.container ?? portalContext.container;
  const displayOrderBase = props.displayOrderBase ?? portalContext.displayOrderBase;

  return (
    <PortalProvider container={container} displayOrderBase={displayOrderBase}>
      <Portal>{props.children}</Portal>
    </PortalProvider>
  );
}

export function ComboboxPortal(props: ComboboxPortalProps) {
  const hasOverrides = props.container !== undefined || props.displayOrderBase !== undefined;
  if (hasOverrides) {
    return (
      <ComboboxPortalWithOverrides container={props.container} displayOrderBase={props.displayOrderBase}>
        {props.children}
      </ComboboxPortalWithOverrides>
    );
  }

  return <Portal>{props.children}</Portal>;
}
