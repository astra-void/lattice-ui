import type React from "@rbxts/react";

export type PortalContextValue = {
  container: BasePlayerGui;
  displayOrderBase: number;
};

export type PortalProviderProps = {
  container: BasePlayerGui;
  displayOrderBase?: number;
  children?: React.ReactNode;
};

export type PortalProps = {
  children?: React.ReactNode;
  container?: Instance;
};
