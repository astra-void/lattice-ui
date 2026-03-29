import { React } from "@lattice-ui/core";
import { GridShowcaseScene } from "../../../playground/src/client/scenes/GridShowcaseScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { GridShowcaseScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <GridShowcaseScene />
    </PreviewTargetShell>
  ),
  title: "Grid Showcase",
} as const;
