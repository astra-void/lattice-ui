import { createStrictContext } from "@lattice-ui/core";
import type { SystemThemeContextValue } from "./types";

export const [SystemThemeContextProvider, useSystemThemeContext] =
  createStrictContext<SystemThemeContextValue>("SystemThemeContext");
