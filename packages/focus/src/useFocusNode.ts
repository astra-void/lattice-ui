import { React } from "@lattice-ui/core";
import { useFocusScopeId } from "./context";
import { registerFocusNode, unregisterFocusNode } from "./focusManager";

function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export type UseFocusNodeOptions = {
  ref: React.MutableRefObject<GuiObject | undefined>;
  scopeId?: number;
  disabled?: boolean;
  getDisabled?: () => boolean;
  getVisible?: () => boolean | undefined;
  syncToRoblox?: boolean;
};

export function useFocusNode(options: UseFocusNodeOptions): React.MutableRefObject<number | undefined> {
  const inheritedScopeId = useFocusScopeId();
  const scopeId = options.scopeId ?? inheritedScopeId;
  const nodeIdRef = React.useRef<number>();

  const disabledRef = useLatest(options.disabled === true);
  const getDisabledRef = useLatest(options.getDisabled);
  const getVisibleRef = useLatest(options.getVisible);
  const syncToRobloxRef = useLatest(options.syncToRoblox !== false);

  React.useEffect(() => {
    const nodeId = registerFocusNode({
      scopeId,
      getGuiObject: () => options.ref.current,
      getDisabled: () => disabledRef.current || getDisabledRef.current?.() === true,
      getVisible: () => getVisibleRef.current?.(),
      getSyncToRoblox: () => syncToRobloxRef.current,
    });

    nodeIdRef.current = nodeId;
    return () => {
      unregisterFocusNode(nodeId);
      nodeIdRef.current = undefined;
    };
  }, [options.ref, scopeId]);

  return nodeIdRef;
}
