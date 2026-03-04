import { createStrictContext } from "@lattice-ui/core";
import type { TextFieldContextValue } from "./types";

const [TextFieldContextProvider, useTextFieldContext] = createStrictContext<TextFieldContextValue>("TextField");

export { TextFieldContextProvider, useTextFieldContext };
