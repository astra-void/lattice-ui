import { createStrictContext } from "@lattice-ui/react-runtime";
import type { MenuContextValue, MenuItemContextValue } from "./types";

const [MenuContextProvider, useMenuContext] = createStrictContext<MenuContextValue>("Menu");
const [MenuItemContextProvider, useMenuItemContext] = createStrictContext<MenuItemContextValue>("MenuItem");

export { MenuContextProvider, MenuItemContextProvider, useMenuContext, useMenuItemContext };
