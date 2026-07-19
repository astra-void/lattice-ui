import { createStrictContext } from "@lattice-ui/react-runtime";
import type { SwitchContextValue } from "./types";

const [SwitchContextProvider, useSwitchContext] = createStrictContext<SwitchContextValue>("Switch");

export { SwitchContextProvider, useSwitchContext };
