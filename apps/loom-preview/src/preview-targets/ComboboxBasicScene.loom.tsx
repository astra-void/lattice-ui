import { React } from "@lattice-ui/react-runtime";
import { ComboboxBasicScene } from "../../../playground/src/client/scenes/ComboboxBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { ComboboxBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <ComboboxBasicScene />
    </PreviewTargetShell>
  ),
  title: "Combobox Basic",
} as const;
