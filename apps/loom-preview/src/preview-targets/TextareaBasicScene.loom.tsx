import { React } from "@lattice-ui/core";
import { TextareaBasicScene } from "../../../playground/src/client/scenes/TextareaBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { TextareaBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <TextareaBasicScene />
    </PreviewTargetShell>
  ),
  title: "Textarea Basic",
} as const;
