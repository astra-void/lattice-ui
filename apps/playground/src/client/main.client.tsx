import { React, ReactRoblox } from "@lattice-ui/core";
import { PlaygroundWorkspace } from "./PlaygroundWorkspace";

const Players = game.GetService("Players");
const localPlayer = Players.LocalPlayer;
if (!localPlayer) {
  error("LocalPlayer is required for playground.");
}

const playerGuiInstance = localPlayer.WaitForChild("PlayerGui");
if (!playerGuiInstance.IsA("PlayerGui")) {
  error("PlayerGui instance is required for playground.");
}
const playerGui = playerGuiInstance;
const rootContainer = new Instance("Folder");
rootContainer.Name = "LatticePlaygroundRoot";
rootContainer.Parent = playerGui;

const root = ReactRoblox.createRoot(rootContainer);
root.render(<PlaygroundWorkspace playerGui={playerGui} />);
