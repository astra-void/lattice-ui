import { createStrictContext } from "@lattice-ui/react-runtime";
import type { SystemBaseThemeContextValue } from "./types";

export const [SystemBaseThemeContextProvider, useSystemBaseThemeContext] =
  createStrictContext<SystemBaseThemeContextValue>("SystemBaseThemeContext");
