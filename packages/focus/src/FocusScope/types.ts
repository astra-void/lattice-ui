import type React from "@rbxts/react";

export type FocusScopeProps = {
  active?: boolean;
  asChild?: boolean;
  trapped?: boolean;
  restoreFocus?: boolean;
  children?: React.ReactNode;
};
