import { createStrictContext } from "@lattice-ui/core";
import type { ToggleGroupContextValue } from "./types";

const [ToggleGroupContextProvider, useToggleGroupContext] = createStrictContext<ToggleGroupContextValue>("ToggleGroup");

export { ToggleGroupContextProvider, useToggleGroupContext };
