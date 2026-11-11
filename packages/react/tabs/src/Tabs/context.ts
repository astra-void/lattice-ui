import { createStrictContext } from "@lattice-ui/react-runtime";
import type { TabsContextValue, TabsTriggerContextValue } from "./types";

const [TabsContextProvider, useTabsContext] = createStrictContext<TabsContextValue>("Tabs");
const [TabsTriggerContextProvider, useTabsTriggerContext] = createStrictContext<TabsTriggerContextValue>("TabsTrigger");

export { TabsContextProvider, TabsTriggerContextProvider, useTabsContext, useTabsTriggerContext };
