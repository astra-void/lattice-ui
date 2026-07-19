import { createStrictContext } from "@lattice-ui/core";
import type { ContextMenuContextValue } from "./types";

const [ContextMenuContextProvider, useContextMenuContext] = createStrictContext<ContextMenuContextValue>("ContextMenu");

export { ContextMenuContextProvider, useContextMenuContext };
