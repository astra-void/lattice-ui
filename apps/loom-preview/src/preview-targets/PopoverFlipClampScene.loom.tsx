import { React } from "@lattice-ui/core";
import { PopoverFlipClampScene } from "../../../playground/src/client/scenes/PopoverFlipClampScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { PopoverFlipClampScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <PopoverFlipClampScene />
    </PreviewTargetShell>
  ),
  title: "Popover Flip/Clamp",
} as const;
