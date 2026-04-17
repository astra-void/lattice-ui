import { React, Slot } from "@lattice-ui/core";
import { FocusScopeProvider, useFocusLayerOrder, useFocusScopeId } from "../context";
import {
  createFocusScopeId,
  registerFocusScope,
  releaseExternalFocusBridge,
  retainExternalFocusBridge,
  syncFocusScope,
  unregisterFocusScope,
} from "../focusManager";
import type { FocusScopeProps } from "./types";

function toGuiObject(instance: Instance | undefined) {
  if (!instance?.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function FocusScope(props: FocusScopeProps) {
  const parentScopeId = useFocusScopeId();
  const layerOrder = useFocusLayerOrder();
  const active = props.active ?? true;
  const trapped = props.trapped === true;
  const shouldRestoreFocus = props.restoreFocus !== false;

  const scopeIdRef = React.useRef(0);
  if (scopeIdRef.current === 0) {
    scopeIdRef.current = createFocusScopeId();
  }

  const scopeRootRef = React.useRef<GuiObject>();
  const activeRef = useLatest(active);
  const trappedRef = useLatest(trapped);
  const restoreFocusRef = useLatest(shouldRestoreFocus);
  const layerOrderRef = useLatest(layerOrder);

  const setScopeRoot = React.useCallback((instance: Instance | undefined) => {
    scopeRootRef.current = toGuiObject(instance);
    if (scopeIdRef.current !== 0) {
      syncFocusScope(scopeIdRef.current);
    }
  }, []);

  React.useEffect(() => {
    const scopeId = scopeIdRef.current;
    registerFocusScope(scopeId, {
      parentScopeId,
      getRoot: () => scopeRootRef.current,
      getActive: () => activeRef.current,
      getTrapped: () => trappedRef.current,
      getRestoreFocus: () => restoreFocusRef.current,
      getLayerOrder: () => layerOrderRef.current,
    });

    return () => {
      unregisterFocusScope(scopeId);
    };
  }, [activeRef, layerOrderRef, parentScopeId, restoreFocusRef, trappedRef]);

  React.useEffect(() => {
    syncFocusScope(scopeIdRef.current);
  }, [active, layerOrder, shouldRestoreFocus, trapped]);

  React.useEffect(() => {
    if (!active) {
      return;
    }

    retainExternalFocusBridge();
    return () => {
      releaseExternalFocusBridge();
    };
  }, [active]);

  const content = props.asChild ? (
    (() => {
      const child = props.children;
      if (!React.isValidElement(child)) {
        error("[FocusScope] `asChild` requires a child element.");
      }

      return <Slot ref={setScopeRoot}>{child}</Slot>;
    })()
  ) : (
    <frame
      BackgroundTransparency={1}
      BorderSizePixel={0}
      Position={UDim2.fromScale(0, 0)}
      Size={UDim2.fromScale(1, 1)}
      ref={setScopeRoot}
    >
      {props.children}
    </frame>
  );

  return <FocusScopeProvider scopeId={scopeIdRef.current}>{content}</FocusScopeProvider>;
}
