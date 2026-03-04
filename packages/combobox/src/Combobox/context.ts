import { createStrictContext } from "@lattice-ui/core";
import type { ComboboxContextValue } from "./types";

const [ComboboxContextProvider, useComboboxContext] = createStrictContext<ComboboxContextValue>("Combobox");

export { ComboboxContextProvider, useComboboxContext };
