import { React } from "@lattice-ui/react-runtime";
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
