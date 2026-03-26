import { React } from "@lattice-ui/core";
import { ToastBasicScene } from "../../../playground/src/client/scenes/ToastBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { ToastBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <ToastBasicScene />
    </PreviewTargetShell>
  ),
  title: "Toast Basic",
} as const;
