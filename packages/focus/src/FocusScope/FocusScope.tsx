import { React, Slot } from "@lattice-ui/core";
import { captureFocus, GuiService, restoreFocus } from "./focusManager";
import { isTopTrappedScope, registerTrappedScope, unregisterTrappedScope } from "./scopeStack";
import type { FocusScopeProps } from "./types";

let nextScopeId = 0;

function toGuiObject(instance: Instance | undefined) {
  if (!instance || !instance.IsA("GuiObject")) {
    return undefined;
  }

  return instance;
}

function isLiveGuiObject(guiObject: GuiObject | undefined): guiObject is GuiObject {
  return guiObject !== undefined && guiObject.Parent !== undefined;
}

function getSelectedGuiObject() {
  return GuiService.SelectedObject;
}

function setSelectedGuiObject(guiObject: GuiObject | undefined) {
  GuiService.SelectedObject = guiObject;
}

function isFocusable(guiObject: GuiObject | undefined) {
  return isLiveGuiObject(guiObject) && guiObject.Selectable;
}

function isInsideScope(scopeRoot: GuiObject | undefined, guiObject: GuiObject | undefined) {
  if (!isLiveGuiObject(scopeRoot) || !isLiveGuiObject(guiObject)) {
    return false;
  }

  return guiObject === scopeRoot || guiObject.IsDescendantOf(scopeRoot);
}

function findFirstFocusableInScope(scopeRoot: GuiObject) {
  if (isFocusable(scopeRoot)) {
    return scopeRoot;
  }

  for (const descendant of scopeRoot.GetDescendants()) {
    if (descendant.IsA("GuiObject") && isFocusable(descendant)) {
      return descendant;
    }
  }

  return undefined;
}

function getFocusableRestoreTarget(snapshot: GuiObject | undefined) {
  if (!snapshot) {
    return undefined;
  }

  if (!isFocusable(snapshot)) {
    return undefined;
  }

  return snapshot;
}

export function FocusScope(props: FocusScopeProps) {
  const active = props.active ?? true;
  const trapped = props.trapped === true;
  const shouldRestoreFocus = props.restoreFocus !== false;

  const scopeIdRef = React.useRef(0);
  if (scopeIdRef.current === 0) {
    nextScopeId += 1;
    scopeIdRef.current = nextScopeId;
  }

  const scopeRootRef = React.useRef<GuiObject>();
  const lastFocusedInsideRef = React.useRef<GuiObject>();
  const restoreSnapshotRef = React.useRef<GuiObject>();
  const isRedirectingRef = React.useRef(false);
  const shouldRestoreFocusRef = React.useRef(shouldRestoreFocus);

  React.useEffect(() => {
    shouldRestoreFocusRef.current = shouldRestoreFocus;
  }, [shouldRestoreFocus]);

  const updateLastFocusedInside = React.useCallback(() => {
    const scopeRoot = scopeRootRef.current;
    if (!scopeRoot) {
      return;
    }

    const selectedObject = getSelectedGuiObject();
    if (!selectedObject || !isInsideScope(scopeRoot, selectedObject)) {
      return;
    }

    if (isFocusable(selectedObject)) {
      lastFocusedInsideRef.current = selectedObject;
    }
  }, []);

  const resolveFallbackTarget = React.useCallback(() => {
    const scopeRoot = scopeRootRef.current;
    if (!isLiveGuiObject(scopeRoot)) {
      return undefined;
    }

    const previousFocus = lastFocusedInsideRef.current;
    if (previousFocus && isInsideScope(scopeRoot, previousFocus) && isFocusable(previousFocus)) {
      return previousFocus;
    }

    return findFirstFocusableInScope(scopeRoot);
  }, []);

  const enforceFocusTrap = React.useCallback(() => {
    if (!active || !trapped) {
      return;
    }

    if (!isTopTrappedScope(scopeIdRef.current)) {
      return;
    }

    const scopeRoot = scopeRootRef.current;
    if (!isLiveGuiObject(scopeRoot)) {
      return;
    }

    const selectedObject = getSelectedGuiObject();
    if (selectedObject && isInsideScope(scopeRoot, selectedObject)) {
      if (isFocusable(selectedObject)) {
        lastFocusedInsideRef.current = selectedObject;
      }
      return;
    }

    const fallbackTarget = resolveFallbackTarget();
    if (!fallbackTarget || fallbackTarget === selectedObject) {
      return;
    }

    isRedirectingRef.current = true;
    setSelectedGuiObject(fallbackTarget);
    isRedirectingRef.current = false;
  }, [active, resolveFallbackTarget, trapped]);

  const setScopeRoot = React.useCallback(
    (instance: Instance | undefined) => {
      const scopeRoot = toGuiObject(instance);
      scopeRootRef.current = scopeRoot;
      if (!scopeRoot) {
        return;
      }

      updateLastFocusedInside();

      if (active && trapped) {
        enforceFocusTrap();
      }
    },
    [active, enforceFocusTrap, trapped, updateLastFocusedInside],
  );

  React.useEffect(() => {
    if (!active) {
      restoreSnapshotRef.current = undefined;
      return;
    }

    if (shouldRestoreFocusRef.current) {
      restoreSnapshotRef.current = captureFocus();
    } else {
      restoreSnapshotRef.current = undefined;
    }

    const currentScopeId = scopeIdRef.current;
    if (trapped) {
      registerTrappedScope(currentScopeId);
    }

    const selectedObjectConnection = GuiService.GetPropertyChangedSignal("SelectedObject").Connect(() => {
      if (isRedirectingRef.current) {
        return;
      }

      updateLastFocusedInside();
      if (trapped) {
        enforceFocusTrap();
      }
    });

    if (trapped) {
      enforceFocusTrap();
    }

    return () => {
      selectedObjectConnection.Disconnect();

      if (trapped) {
        unregisterTrappedScope(currentScopeId);
      }

      const restoreTarget = getFocusableRestoreTarget(restoreSnapshotRef.current);
      restoreSnapshotRef.current = undefined;
      if (restoreTarget && shouldRestoreFocusRef.current) {
        restoreFocus(restoreTarget);
      }
    };
  }, [active, enforceFocusTrap, trapped, updateLastFocusedInside]);

  if (props.asChild) {
    const child = props.children;
    if (!React.isValidElement(child)) {
      error("[FocusScope] `asChild` requires a child element.");
    }

    return <Slot ref={setScopeRoot}>{child}</Slot>;
  }

  return (
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
}
