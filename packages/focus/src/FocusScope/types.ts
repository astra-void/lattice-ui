import { type React } from "@lattice-ui/core";

export type FocusScopeProps = {
  active?: boolean;
  asChild?: boolean;
  trapped?: boolean;
  restoreFocus?: boolean;
  children?: React.ReactNode;
};
