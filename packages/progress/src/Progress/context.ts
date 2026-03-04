import { createStrictContext } from "@lattice-ui/core";
import type { ProgressContextValue } from "./types";

const [ProgressContextProvider, useProgressContext] = createStrictContext<ProgressContextValue>("Progress");

export { ProgressContextProvider, useProgressContext };
