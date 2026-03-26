import { React } from "@lattice-ui/core";
import { DialogNestedScene } from "../../../playground/src/client/scenes/DialogNestedScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { DialogNestedScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <DialogNestedScene />
    </PreviewTargetShell>
  ),
  title: "Dialog Nested",
} as const;
