import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ContextMenuContextValue, ContextMenuItemContextValue } from "./types";

const [ContextMenuContextProvider, useContextMenuContext] = createStrictContext<ContextMenuContextValue>("ContextMenu");
const [ContextMenuItemContextProvider, useContextMenuItemContext] =
  createStrictContext<ContextMenuItemContextValue>("ContextMenuItem");

export { ContextMenuContextProvider, ContextMenuItemContextProvider, useContextMenuContext, useContextMenuItemContext };
