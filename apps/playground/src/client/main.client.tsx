import { React, ReactRoblox } from "@lattice-ui/react-runtime";
import { PlaygroundWorkspace } from "./PlaygroundWorkspace";

const Players = game.GetService("Players");
const StarterGui = game.GetService("StarterGui");
const localPlayer = Players.LocalPlayer;
if (!localPlayer) {
  error("LocalPlayer is required for playground.");
}

// Declutter the demo surface: hide the default Roblox player list / chat so
// they do not overlap the playground header controls in the top-right.
pcall(() => {
  StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false);
  StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Chat, false);
});

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
