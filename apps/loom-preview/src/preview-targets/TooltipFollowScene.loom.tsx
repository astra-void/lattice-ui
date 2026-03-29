import { React } from "@lattice-ui/core";
import { TooltipFollowScene } from "../../../playground/src/client/scenes/TooltipFollowScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { TooltipFollowScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <TooltipFollowScene />
    </PreviewTargetShell>
  ),
  title: "Tooltip Follow",
} as const;
