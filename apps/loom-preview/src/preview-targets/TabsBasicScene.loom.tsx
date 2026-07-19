import { React } from "@lattice-ui/react-runtime";
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
