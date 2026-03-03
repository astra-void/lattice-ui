import { createStrictContext } from "@lattice-ui/core";
import type { CheckboxContextValue } from "./types";

const [CheckboxContextProvider, useCheckboxContext] = createStrictContext<CheckboxContextValue>("Checkbox");

export { CheckboxContextProvider, useCheckboxContext };
