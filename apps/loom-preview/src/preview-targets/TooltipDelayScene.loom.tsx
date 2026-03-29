import { React } from "@lattice-ui/core";
import { TooltipDelayScene } from "../../../playground/src/client/scenes/TooltipDelayScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { TooltipDelayScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <TooltipDelayScene />
    </PreviewTargetShell>
  ),
  title: "Tooltip Delay",
} as const;
