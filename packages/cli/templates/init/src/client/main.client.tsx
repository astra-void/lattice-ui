import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { ThemeProvider, defaultLightTheme } from "@lattice-ui/style";
import { App } from "./App";

const Players = game.GetService("Players");
const player = Players.LocalPlayer;
if (!player) {
  error("LocalPlayer is required.");
}

const playerGuiInstance = player.WaitForChild("PlayerGui");
if (!playerGuiInstance.IsA("PlayerGui")) {
  error("PlayerGui is required.");
}

const container = new Instance("Folder");
container.Name = "LatticeRoot";
container.Parent = playerGuiInstance;

const root = ReactRoblox.createRoot(container);
root.render(
  <ThemeProvider theme={defaultLightTheme}>
    <App />
  </ThemeProvider>,
);
