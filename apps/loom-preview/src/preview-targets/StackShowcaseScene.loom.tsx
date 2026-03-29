import { React } from "@lattice-ui/core";
import { StackShowcaseScene } from "../../../playground/src/client/scenes/StackShowcaseScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { StackShowcaseScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <StackShowcaseScene />
    </PreviewTargetShell>
  ),
  title: "Stack Showcase",
} as const;
