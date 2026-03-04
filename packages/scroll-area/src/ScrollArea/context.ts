import { createStrictContext } from "@lattice-ui/core";
import type { ScrollAreaContextValue } from "./types";

const [ScrollAreaContextProvider, useScrollAreaContext] = createStrictContext<ScrollAreaContextValue>("ScrollArea");

export { ScrollAreaContextProvider, useScrollAreaContext };
