import { createStrictContext } from "@lattice-ui/react-runtime";
import type { SystemThemeContextValue } from "./types";

export const [SystemThemeContextProvider, useSystemThemeContext] =
  createStrictContext<SystemThemeContextValue>("SystemThemeContext");
