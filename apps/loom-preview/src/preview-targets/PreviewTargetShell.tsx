import { React } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { defaultDarkTheme } from "@lattice-ui/style";
import { SystemProvider } from "@lattice-ui/system";

type PreviewTargetShellProps = {
  children: React.ReactNode;
};

function getPreviewPortalContainer() {
  const players = game.GetService("Players");
  const localPlayer = players.LocalPlayer;

  if (!localPlayer) {
    error("LocalPlayer is required for the preview target shell.");
  }

  const playerGui = localPlayer.WaitForChild("PlayerGui");
  if (!playerGui.IsA("PlayerGui")) {
    error("PlayerGui is required for the preview target shell.");
  }

  return playerGui;
}

export function PreviewTargetShell(props: PreviewTargetShellProps) {
  return (
    <PortalProvider container={getPreviewPortalContainer()}>
      <SystemProvider defaultDensity="comfortable" defaultTheme={defaultDarkTheme}>
        {props.children}
      </SystemProvider>
    </PortalProvider>
  );
}
