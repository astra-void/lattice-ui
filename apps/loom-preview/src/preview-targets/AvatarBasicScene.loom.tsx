import { React } from "@lattice-ui/core";
import { AvatarBasicScene } from "../../../playground/src/client/scenes/AvatarBasicScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { AvatarBasicScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <AvatarBasicScene />
    </PreviewTargetShell>
  ),
  title: "Avatar Basic",
} as const;
