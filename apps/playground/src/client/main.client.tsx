import { React, ReactRoblox } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { DialogBasicScene } from "./scenes/DialogBasicScene";
import { DialogModalBlockScene } from "./scenes/DialogModalBlockScene";
import { DialogNestedScene } from "./scenes/DialogNestedScene";
import { InsetHitTestScene } from "./scenes/InsetHitTestScene";
import { LayerDismissScene } from "./scenes/LayerDismissScene";
import { ModalBlockScene } from "./scenes/ModalBlockScene";
import { NestedStackScene } from "./scenes/NestedStackScene";
import { PresenceScene } from "./scenes/PresenceScene";

type SceneKey =
  | "dismiss"
  | "nested"
  | "modal"
  | "presence"
  | "inset"
  | "dialog-basic"
  | "dialog-nested"
  | "dialog-modal";

const sceneOptions = [
  { key: "dismiss", label: "Layer Dismiss" },
  { key: "nested", label: "Nested Stack" },
  { key: "modal", label: "Modal Block" },
  { key: "presence", label: "Presence" },
  { key: "inset", label: "Inset Hit-Test" },
  { key: "dialog-basic", label: "Dialog Basic" },
  { key: "dialog-nested", label: "Dialog Nested" },
  { key: "dialog-modal", label: "Dialog Modal Block" },
] satisfies ReadonlyArray<{ key: SceneKey; label: string }>;

type AppProps = {
  playerGui: PlayerGui;
};

function App(props: AppProps) {
  const [activeScene, setActiveScene] = React.useState<SceneKey>("dismiss");

  return (
    <PortalProvider container={props.playerGui}>
      <screengui IgnoreGuiInset={true} ResetOnSpawn={false}>
        <frame
          BackgroundColor3={Color3.fromRGB(18, 21, 26)}
          BorderSizePixel={0}
          Position={UDim2.fromScale(0, 0)}
          Size={UDim2.fromScale(1, 1)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 10)} />

          <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(900, 44)}>
            <uipadding PaddingLeft={new UDim(0, 16)} PaddingTop={new UDim(0, 10)} />
            <uigridlayout CellPadding={UDim2.fromOffset(8, 8)} CellSize={UDim2.fromOffset(145, 34)} />
            {sceneOptions.map((scene) => {
              const selected = scene.key === activeScene;
              return (
                <textbutton
                  AutoButtonColor={false}
                  BackgroundColor3={selected ? Color3.fromRGB(35, 92, 178) : Color3.fromRGB(33, 37, 46)}
                  BorderSizePixel={0}
                  key={scene.key}
                  Text={scene.label}
                  TextColor3={Color3.fromRGB(235, 239, 245)}
                  TextSize={16}
                  Event={{
                    Activated: () => {
                      setActiveScene(scene.key);
                    },
                  }}
                />
              );
            })}
          </frame>

          <frame
            BackgroundTransparency={1}
            LayoutOrder={2}
            Position={UDim2.fromScale(0, 0)}
            Size={UDim2.fromScale(1, 1)}
          >
            <uipadding PaddingLeft={new UDim(0, 16)} PaddingTop={new UDim(0, 8)} />
            {activeScene === "dismiss" ? <LayerDismissScene /> : undefined}
            {activeScene === "nested" ? <NestedStackScene /> : undefined}
            {activeScene === "modal" ? <ModalBlockScene /> : undefined}
            {activeScene === "presence" ? <PresenceScene /> : undefined}
            {activeScene === "inset" ? <InsetHitTestScene /> : undefined}
            {activeScene === "dialog-basic" ? <DialogBasicScene /> : undefined}
            {activeScene === "dialog-nested" ? <DialogNestedScene /> : undefined}
            {activeScene === "dialog-modal" ? <DialogModalBlockScene /> : undefined}
          </frame>
        </frame>
      </screengui>
    </PortalProvider>
  );
}

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
root.render(<App playerGui={playerGui} />);
