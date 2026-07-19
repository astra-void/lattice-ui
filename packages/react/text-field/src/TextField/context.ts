import { createStrictContext } from "@lattice-ui/react-runtime";
import type { TextFieldContextValue } from "./types";

const [TextFieldContextProvider, useTextFieldContext] = createStrictContext<TextFieldContextValue>("TextField");

export { TextFieldContextProvider, useTextFieldContext };
