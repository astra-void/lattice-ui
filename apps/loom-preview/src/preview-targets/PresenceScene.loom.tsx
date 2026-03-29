import { React } from "@lattice-ui/core";
import { PresenceScene } from "../../../playground/src/client/scenes/PresenceScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { PresenceScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <PresenceScene />
    </PreviewTargetShell>
  ),
  title: "Presence",
} as const;
