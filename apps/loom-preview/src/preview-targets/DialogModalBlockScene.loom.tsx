import React from "@rbxts/react";
import { DialogModalBlockScene } from "../../../playground/src/client/scenes/DialogModalBlockScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { DialogModalBlockScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <DialogModalBlockScene />
    </PreviewTargetShell>
  ),
  title: "Dialog Modal Block",
} as const;
