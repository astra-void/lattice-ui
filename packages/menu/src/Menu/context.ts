import { createStrictContext } from "@lattice-ui/core";
import type { MenuContextValue } from "./types";

const [MenuContextProvider, useMenuContext] = createStrictContext<MenuContextValue>("Menu");

export { MenuContextProvider, useMenuContext };
