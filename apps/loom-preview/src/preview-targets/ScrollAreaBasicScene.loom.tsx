import { React } from "@lattice-ui/core";
import { ScrollAreaBasicScene } from "../../../playground/src/client/scenes/ScrollAreaBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { ScrollAreaBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <ScrollAreaBasicScene />
    </PreviewTargetShell>
  ),
  title: "Scroll Area Basic",
} as const;
