import { React, ReactRoblox } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { defaultDarkTheme, defaultLightTheme, mergeGuiProps, Text, ThemeProvider, useTheme } from "@lattice-ui/style";
import { DialogBasicScene } from "./scenes/DialogBasicScene";
import { DialogModalBlockScene } from "./scenes/DialogModalBlockScene";
import { DialogNestedScene } from "./scenes/DialogNestedScene";
import { InsetHitTestScene } from "./scenes/InsetHitTestScene";
import { LayerDismissScene } from "./scenes/LayerDismissScene";
import { MenuRovingScene } from "./scenes/MenuRovingScene";
import { ModalBlockScene } from "./scenes/ModalBlockScene";
import { NestedStackScene } from "./scenes/NestedStackScene";
import { PopoverBasicScene } from "./scenes/PopoverBasicScene";
import { PopoverFlipClampScene } from "./scenes/PopoverFlipClampScene";
import { PopoverNestedScene } from "./scenes/PopoverNestedScene";
import { PresenceScene } from "./scenes/PresenceScene";
import { TabsBasicScene } from "./scenes/TabsBasicScene";
import { TooltipDelayScene } from "./scenes/TooltipDelayScene";
import { TooltipFollowScene } from "./scenes/TooltipFollowScene";
import { buttonRecipe, sceneTabRecipe } from "./theme/recipes";

type SceneKey =
  | "dismiss"
  | "nested"
  | "modal"
  | "presence"
  | "inset"
  | "dialog-basic"
  | "dialog-nested"
  | "dialog-modal"
  | "popover-basic"
  | "popover-flip"
  | "popover-nested"
  | "tabs-basic"
  | "tooltip-delay"
  | "tooltip-follow"
  | "menu-roving";

const sceneOptions = [
  { key: "dismiss", label: "Layer Dismiss" },
  { key: "nested", label: "Nested Stack" },
  { key: "modal", label: "Modal Block" },
  { key: "presence", label: "Presence" },
  { key: "inset", label: "Inset Hit-Test" },
  { key: "dialog-basic", label: "Dialog Basic" },
  { key: "dialog-nested", label: "Dialog Nested" },
  { key: "dialog-modal", label: "Dialog Modal Block" },
  { key: "popover-basic", label: "Popover Basic" },
  { key: "popover-flip", label: "Popover Flip/Clamp" },
  { key: "popover-nested", label: "Popover Nested" },
  { key: "tabs-basic", label: "Tabs Basic" },
  { key: "tooltip-delay", label: "Tooltip Delay" },
  { key: "tooltip-follow", label: "Tooltip Follow" },
  { key: "menu-roving", label: "Menu Roving" },
] satisfies ReadonlyArray<{ key: SceneKey; label: string }>;

type AppProps = {
  playerGui: PlayerGui;
};

function AppContent(props: AppProps) {
  const [activeScene, setActiveScene] = React.useState<SceneKey>("dismiss");
  const [darkMode, setDarkMode] = React.useState(true);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setTheme(darkMode ? defaultDarkTheme : defaultLightTheme);
  }, [darkMode, setTheme]);

  return (
    <PortalProvider container={props.playerGui}>
      <screengui IgnoreGuiInset={true} ResetOnSpawn={false}>
        <frame
          BackgroundColor3={theme.colors.background}
          BorderSizePixel={0}
          Position={UDim2.fromScale(0, 0)}
          Size={UDim2.fromScale(1, 1)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(940, 92)}>
            <uipadding PaddingLeft={new UDim(0, theme.space[16])} PaddingTop={new UDim(0, theme.space[10])} />
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

            <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(900, 38)}>
              <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: darkMode ? "surface" : "primary", size: "sm" }, theme), {
                  Text: darkMode ? "Dark Theme" : "Light Theme",
                  Event: {
                    Activated: () => {
                      setDarkMode((value) => !value);
                    },
                  },
                }) as Record<string, unknown>)}
              />
              <Text
                BackgroundTransparency={1}
                LayoutOrder={2}
                Position={UDim2.fromOffset(0, 7)}
                Size={UDim2.fromOffset(320, 24)}
                Text={`Active Scene: ${activeScene}`}
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>

            <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(900, 44)}>
              <uigridlayout
                CellPadding={UDim2.fromOffset(theme.space[8], theme.space[8])}
                CellSize={UDim2.fromOffset(145, 34)}
              />
              {sceneOptions.map((scene) => {
                const selected = scene.key === activeScene;

                return (
                  <textbutton
                    key={scene.key}
                    {...(mergeGuiProps(sceneTabRecipe({ selected: selected ? "true" : "false" }, theme), {
                      Text: scene.label,
                      Event: {
                        Activated: () => {
                          setActiveScene(scene.key);
                        },
                      },
                    }) as Record<string, unknown>)}
                  />
                );
              })}
            </frame>
          </frame>

          <frame
            BackgroundTransparency={1}
            LayoutOrder={2}
            Position={UDim2.fromScale(0, 0)}
            Size={UDim2.fromScale(1, 1)}
          >
            <uipadding PaddingLeft={new UDim(0, theme.space[16])} PaddingTop={new UDim(0, theme.space[8])} />
            {activeScene === "dismiss" ? <LayerDismissScene /> : undefined}
            {activeScene === "nested" ? <NestedStackScene /> : undefined}
            {activeScene === "modal" ? <ModalBlockScene /> : undefined}
            {activeScene === "presence" ? <PresenceScene /> : undefined}
            {activeScene === "inset" ? <InsetHitTestScene /> : undefined}
            {activeScene === "dialog-basic" ? <DialogBasicScene /> : undefined}
            {activeScene === "dialog-nested" ? <DialogNestedScene /> : undefined}
            {activeScene === "dialog-modal" ? <DialogModalBlockScene /> : undefined}
            {activeScene === "popover-basic" ? <PopoverBasicScene /> : undefined}
            {activeScene === "popover-flip" ? <PopoverFlipClampScene /> : undefined}
            {activeScene === "popover-nested" ? <PopoverNestedScene /> : undefined}
            {activeScene === "tabs-basic" ? <TabsBasicScene /> : undefined}
            {activeScene === "tooltip-delay" ? <TooltipDelayScene /> : undefined}
            {activeScene === "tooltip-follow" ? <TooltipFollowScene /> : undefined}
            {activeScene === "menu-roving" ? <MenuRovingScene /> : undefined}
          </frame>
        </frame>
      </screengui>
    </PortalProvider>
  );
}

function App(props: AppProps) {
  return (
    <ThemeProvider defaultTheme={defaultDarkTheme}>
      <AppContent playerGui={props.playerGui} />
    </ThemeProvider>
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
