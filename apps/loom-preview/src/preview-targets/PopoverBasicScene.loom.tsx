import { React } from "@lattice-ui/core";
import { PopoverBasicScene } from "../../../playground/src/client/scenes/PopoverBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { PopoverBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <PopoverBasicScene />
    </PreviewTargetShell>
  ),
  title: "Popover Basic",
} as const;
