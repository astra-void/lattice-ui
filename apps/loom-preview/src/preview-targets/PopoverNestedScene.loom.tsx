import { React } from "@lattice-ui/core";
import { PopoverNestedScene } from "../../../playground/src/client/scenes/PopoverNestedScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { PopoverNestedScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <PopoverNestedScene />
    </PreviewTargetShell>
  ),
  title: "Popover Nested",
} as const;
