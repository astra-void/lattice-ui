import { React, type React as ReactType } from "@lattice-ui/core";

const FocusScopeIdContext = React.createContext<number | undefined>(undefined);
const FocusLayerOrderContext = React.createContext<number | undefined>(undefined);

type FocusScopeProviderProps = {
  scopeId?: number;
  children?: ReactType.ReactNode;
};

type FocusLayerProviderProps = {
  layerOrder?: number;
  children?: ReactType.ReactNode;
};

export function FocusScopeProvider(props: FocusScopeProviderProps) {
  return <FocusScopeIdContext.Provider value={props.scopeId}>{props.children}</FocusScopeIdContext.Provider>;
}

export function useFocusScopeId() {
  return React.useContext(FocusScopeIdContext);
}

export function FocusLayerProvider(props: FocusLayerProviderProps) {
  return <FocusLayerOrderContext.Provider value={props.layerOrder}>{props.children}</FocusLayerOrderContext.Provider>;
}

export function useFocusLayerOrder() {
  return React.useContext(FocusLayerOrderContext);
}
