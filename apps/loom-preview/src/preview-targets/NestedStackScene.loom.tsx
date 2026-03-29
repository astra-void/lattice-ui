import { React } from "@lattice-ui/core";
import { NestedStackScene } from "../../../playground/src/client/scenes/NestedStackScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { NestedStackScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <NestedStackScene />
    </PreviewTargetShell>
  ),
  title: "Nested Stack",
} as const;
