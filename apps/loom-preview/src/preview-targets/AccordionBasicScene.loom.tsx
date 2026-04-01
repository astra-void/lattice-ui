import React from "@rbxts/react";
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
