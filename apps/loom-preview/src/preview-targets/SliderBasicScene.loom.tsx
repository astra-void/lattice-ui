import { React } from "@lattice-ui/core";
import { SliderBasicScene } from "../../../playground/src/client/scenes/SliderBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { SliderBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <SliderBasicScene />
    </PreviewTargetShell>
  ),
  title: "Slider Basic",
} as const;
