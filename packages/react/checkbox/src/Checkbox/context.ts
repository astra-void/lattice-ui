import { createStrictContext } from "@lattice-ui/react-runtime";
import type { CheckboxContextValue } from "./types";

const [CheckboxContextProvider, useCheckboxContext] = createStrictContext<CheckboxContextValue>("Checkbox");

export { CheckboxContextProvider, useCheckboxContext };
