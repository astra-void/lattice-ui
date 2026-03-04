import { createStrictContext } from "@lattice-ui/core";
import type { SelectContextValue } from "./types";

const [SelectContextProvider, useSelectContext] = createStrictContext<SelectContextValue>("Select");

export { SelectContextProvider, useSelectContext };
