import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ContextMenuContextValue } from "./types";

const [ContextMenuContextProvider, useContextMenuContext] = createStrictContext<ContextMenuContextValue>("ContextMenu");

export { ContextMenuContextProvider, useContextMenuContext };
