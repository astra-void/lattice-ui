import { React } from "@lattice-ui/react-runtime";
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
