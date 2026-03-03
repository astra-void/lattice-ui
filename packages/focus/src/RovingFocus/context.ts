import { createStrictContext } from "@lattice-ui/core";
import type { RovingFocusContextValue } from "./types";

const [RovingFocusProvider, useRovingFocusContext] = createStrictContext<RovingFocusContextValue>("RovingFocusGroup");

export { RovingFocusProvider, useRovingFocusContext };
