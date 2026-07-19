import { React } from "@lattice-ui/react-runtime";
import { ToggleGroupBasicScene } from "../../../playground/src/client/scenes/ToggleGroupBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { ToggleGroupBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <ToggleGroupBasicScene />
    </PreviewTargetShell>
  ),
  title: "Toggle Basic",
} as const;
