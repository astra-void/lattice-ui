import { React } from "@lattice-ui/core";
import { LayerDismissScene } from "../../../playground/src/client/scenes/LayerDismissScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { LayerDismissScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <LayerDismissScene />
    </PreviewTargetShell>
  ),
  title: "Layer Dismiss",
} as const;
