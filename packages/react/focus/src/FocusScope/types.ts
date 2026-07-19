import type { React } from "@lattice-ui/react-runtime";
import type { NavOrientation, NavStrategy } from "../focusManager";

export type FocusScopeProps = {
  active?: boolean;
  asChild?: boolean;
  trapped?: boolean;
  restoreFocus?: boolean;
  // How directional navigation resolves between nodes inside this scope.
  // Defaults to "spatial". Ordered scopes (menus, tab lists) step by order
  // along `navOrientation` and escape cross-axis moves to the parent scope.
  navStrategy?: NavStrategy;
  navOrientation?: NavOrientation;
  navWrap?: boolean;
  children?: React.ReactNode;
};
