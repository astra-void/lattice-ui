import { createStrictContext } from "@lattice-ui/react-runtime";
import type { SelectContextValue, SelectItemContextValue } from "./types";

const [SelectContextProvider, useSelectContext] = createStrictContext<SelectContextValue>("Select");
const [SelectItemContextProvider, useSelectItemContext] = createStrictContext<SelectItemContextValue>("SelectItem");

export { SelectContextProvider, SelectItemContextProvider, useSelectContext, useSelectItemContext };
