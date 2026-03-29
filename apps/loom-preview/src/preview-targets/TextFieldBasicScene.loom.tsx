import { React } from "@lattice-ui/core";
import { TextFieldBasicScene } from "../../../playground/src/client/scenes/TextFieldBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { TextFieldBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <TextFieldBasicScene />
    </PreviewTargetShell>
  ),
  title: "TextField Basic",
} as const;
