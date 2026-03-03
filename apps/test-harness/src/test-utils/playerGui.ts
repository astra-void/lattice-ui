const Players = game.GetService("Players");

export function getLocalPlayerGui() {
  const localPlayer = Players.LocalPlayer;
  if (!localPlayer) {
    error("[test-harness] LocalPlayer is required to run client-side tests.");
  }

  const playerGuiInstance = localPlayer.FindFirstChild("PlayerGui") ?? localPlayer.WaitForChild("PlayerGui");
  if (!playerGuiInstance.IsA("PlayerGui")) {
    error("[test-harness] LocalPlayer.PlayerGui is required to run tests.");
  }

  return playerGuiInstance;
}

export function createTestContainer(name: string) {
  const playerGui = getLocalPlayerGui();
  const container = new Instance("Folder");
  container.Name = name;
  container.Parent = playerGui;
  return container;
}
