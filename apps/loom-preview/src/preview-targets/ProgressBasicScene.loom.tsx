import { React } from "@lattice-ui/core";
import { ProgressBasicScene } from "../../../playground/src/client/scenes/ProgressBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { ProgressBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <ProgressBasicScene />
    </PreviewTargetShell>
  ),
  title: "Progress Basic",
} as const;
