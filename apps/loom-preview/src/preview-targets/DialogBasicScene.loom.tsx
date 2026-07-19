import { React } from "@lattice-ui/react-runtime";
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
