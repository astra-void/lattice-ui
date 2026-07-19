import { React } from "@lattice-ui/react-runtime";
import { SwitchBasicScene } from "../../../playground/src/client/scenes/SwitchBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { SwitchBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <SwitchBasicScene />
    </PreviewTargetShell>
  ),
  title: "Switch Basic",
} as const;
