import { React } from "@lattice-ui/core";
import { TabsBasicScene } from "../../../playground/src/client/scenes/TabsBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { TabsBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <TabsBasicScene />
    </PreviewTargetShell>
  ),
  title: "Tabs Basic",
} as const;
