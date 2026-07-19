import { React } from "@lattice-ui/react-runtime";
import { ModalBlockScene } from "../../../playground/src/client/scenes/ModalBlockScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { ModalBlockScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <ModalBlockScene />
    </PreviewTargetShell>
  ),
  title: "Modal Block",
} as const;
