import { React } from "@lattice-ui/core";
import { DialogBasicScene } from "../../../playground/src/client/scenes/DialogBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { DialogBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <DialogBasicScene />
    </PreviewTargetShell>
  ),
  title: "Dialog Basic",
} as const;
