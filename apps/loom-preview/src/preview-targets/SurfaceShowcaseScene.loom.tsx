import { React } from "@lattice-ui/react-runtime";
import { SurfaceShowcaseScene } from "../../../playground/src/client/scenes/SurfaceShowcaseScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { SurfaceShowcaseScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <SurfaceShowcaseScene />
    </PreviewTargetShell>
  ),
  title: "Surface Showcase",
} as const;
