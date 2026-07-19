import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ToggleGroupContextValue } from "./types";

const [ToggleGroupContextProvider, useToggleGroupContext] = createStrictContext<ToggleGroupContextValue>("ToggleGroup");

export { ToggleGroupContextProvider, useToggleGroupContext };
