import { createStrictContext } from "@lattice-ui/react-runtime";
import type { AvatarContextValue } from "./types";

const [AvatarContextProvider, useAvatarContext] = createStrictContext<AvatarContextValue>("Avatar");

export { AvatarContextProvider, useAvatarContext };
