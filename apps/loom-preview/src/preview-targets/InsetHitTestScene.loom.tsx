import { React } from "@lattice-ui/react-runtime";
import { InsetHitTestScene } from "../../../playground/src/client/scenes/InsetHitTestScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { InsetHitTestScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <InsetHitTestScene />
    </PreviewTargetShell>
  ),
  title: "Inset Hit-Test",
} as const;
