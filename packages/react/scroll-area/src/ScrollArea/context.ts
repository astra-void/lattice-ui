import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ScrollAreaContextValue } from "./types";

const [ScrollAreaContextProvider, useScrollAreaContext] = createStrictContext<ScrollAreaContextValue>("ScrollArea");

export { ScrollAreaContextProvider, useScrollAreaContext };
