import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ComboboxContextValue, ComboboxItemContextValue } from "./types";

const [ComboboxContextProvider, useComboboxContext] = createStrictContext<ComboboxContextValue>("Combobox");
const [ComboboxItemContextProvider, useComboboxItemContext] =
  createStrictContext<ComboboxItemContextValue>("ComboboxItem");

export { ComboboxContextProvider, ComboboxItemContextProvider, useComboboxContext, useComboboxItemContext };
