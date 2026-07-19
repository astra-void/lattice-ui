import { createStrictContext } from "@lattice-ui/react-runtime";
import type { MenuContextValue } from "./types";

const [MenuContextProvider, useMenuContext] = createStrictContext<MenuContextValue>("Menu");

export { MenuContextProvider, useMenuContext };
