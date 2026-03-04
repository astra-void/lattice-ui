import { createStrictContext } from "@lattice-ui/core";
import type { TextareaContextValue } from "./types";

const [TextareaContextProvider, useTextareaContext] = createStrictContext<TextareaContextValue>("Textarea");

export { TextareaContextProvider, useTextareaContext };
