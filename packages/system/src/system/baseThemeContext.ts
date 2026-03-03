import { createStrictContext } from "@lattice-ui/core";
import type { SystemBaseThemeContextValue } from "./types";

export const [SystemBaseThemeContextProvider, useSystemBaseThemeContext] =
  createStrictContext<SystemBaseThemeContextValue>("SystemProvider");
