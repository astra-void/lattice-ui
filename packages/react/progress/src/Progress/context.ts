import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ProgressContextValue } from "./types";

const [ProgressContextProvider, useProgressContext] = createStrictContext<ProgressContextValue>("Progress");

export { ProgressContextProvider, useProgressContext };
