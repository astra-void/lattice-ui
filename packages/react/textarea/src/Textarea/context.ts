import { createStrictContext } from "@lattice-ui/react-runtime";
import type { TextareaContextValue } from "./types";

const [TextareaContextProvider, useTextareaContext] = createStrictContext<TextareaContextValue>("Textarea");

export { TextareaContextProvider, useTextareaContext };
