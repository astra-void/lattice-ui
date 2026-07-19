import { createStrictContext } from "@lattice-ui/react-runtime";
import type { TabsContextValue } from "./types";

const [TabsContextProvider, useTabsContext] = createStrictContext<TabsContextValue>("Tabs");

export { TabsContextProvider, useTabsContext };
