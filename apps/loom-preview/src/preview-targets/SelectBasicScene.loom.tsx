import { React } from "@lattice-ui/core";
import { SelectBasicScene } from "../../../playground/src/client/scenes/SelectBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { SelectBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <SelectBasicScene />
    </PreviewTargetShell>
  ),
  title: "Select Basic",
} as const;
