import { React } from "@lattice-ui/core";
import { DensityScopeScene } from "../../../playground/src/client/scenes/DensityScopeScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { DensityScopeScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <DensityScopeScene />
    </PreviewTargetShell>
  ),
  title: "Density Scope",
} as const;
