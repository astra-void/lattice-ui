import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ToggleGroupContextValue, ToggleGroupItemContextValue } from "./types";

const [ToggleGroupContextProvider, useToggleGroupContext] = createStrictContext<ToggleGroupContextValue>("ToggleGroup");

const [ToggleGroupItemContextProvider, useToggleGroupItemContext] =
  createStrictContext<ToggleGroupItemContextValue>("ToggleGroupItem");

export { ToggleGroupContextProvider, ToggleGroupItemContextProvider, useToggleGroupContext, useToggleGroupItemContext };
