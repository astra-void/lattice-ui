import { React } from "@lattice-ui/core";
import { AccordionBasicScene } from "../../../playground/src/client/scenes/AccordionBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { AccordionBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <AccordionBasicScene />
    </PreviewTargetShell>
  ),
  title: "Accordion Basic",
} as const;
