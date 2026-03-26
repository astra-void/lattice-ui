import { React } from "@lattice-ui/core";
import { RadioGroupDisabledScene } from "../../../playground/src/client/scenes/RadioGroupDisabledScene";
import { PreviewTargetShell } from "./PreviewTargetShell";

export { RadioGroupDisabledScene };

export const preview = {
  render: () => (
    <PreviewTargetShell>
      <RadioGroupDisabledScene />
    </PreviewTargetShell>
  ),
  title: "Radio Group Disabled",
} as const;
