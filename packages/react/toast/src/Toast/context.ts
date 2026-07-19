import { createStrictContext } from "@lattice-ui/react-runtime";
import type { ToastContextValue } from "./types";

const [ToastContextProvider, useToastContext] = createStrictContext<ToastContextValue>("Toast");

export { ToastContextProvider, useToastContext };
