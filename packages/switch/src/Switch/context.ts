import { createStrictContext } from "@lattice-ui/core";
import type { SwitchContextValue } from "./types";

const [SwitchContextProvider, useSwitchContext] = createStrictContext<SwitchContextValue>("Switch");

export { SwitchContextProvider, useSwitchContext };
