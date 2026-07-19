import { createStrictContext } from "@lattice-ui/react-runtime";
import type { SelectContextValue } from "./types";

const [SelectContextProvider, useSelectContext] = createStrictContext<SelectContextValue>("Select");

export { SelectContextProvider, useSelectContext };
