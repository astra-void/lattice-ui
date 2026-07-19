import { React } from "@lattice-ui/react-runtime";
import { CheckboxBasicScene } from "../../../playground/src/client/scenes/CheckboxBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { CheckboxBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <CheckboxBasicScene />
    </PreviewTargetShell>
  ),
  title: "Checkbox Basic",
} as const;
