import { React, ReactRoblox } from "@lattice-ui/core";
import { PortalProvider } from "@lattice-ui/layer";
import { defaultDarkTheme, defaultLightTheme, mergeGuiProps, Text } from "@lattice-ui/style";
import type { DensityToken } from "@lattice-ui/system";
import { SystemProvider, useSystemTheme } from "@lattice-ui/system";
import { AccordionBasicScene } from "./scenes/AccordionBasicScene";
import { AvatarBasicScene } from "./scenes/AvatarBasicScene";
import { CheckboxBasicScene } from "./scenes/CheckboxBasicScene";
import { ComboboxBasicScene } from "./scenes/ComboboxBasicScene";
import { DensityScopeScene } from "./scenes/DensityScopeScene";
import { DialogBasicScene } from "./scenes/DialogBasicScene";
import { DialogModalBlockScene } from "./scenes/DialogModalBlockScene";
import { DialogNestedScene } from "./scenes/DialogNestedScene";
import { GridShowcaseScene } from "./scenes/GridShowcaseScene";
import { InsetHitTestScene } from "./scenes/InsetHitTestScene";
import { LayerDismissScene } from "./scenes/LayerDismissScene";
import { MenuRovingScene } from "./scenes/MenuRovingScene";
import { ModalBlockScene } from "./scenes/ModalBlockScene";
import { NestedStackScene } from "./scenes/NestedStackScene";
import { PopoverBasicScene } from "./scenes/PopoverBasicScene";
import { PopoverFlipClampScene } from "./scenes/PopoverFlipClampScene";
import { PopoverNestedScene } from "./scenes/PopoverNestedScene";
import { ProgressBasicScene } from "./scenes/ProgressBasicScene";
import { PresenceScene } from "./scenes/PresenceScene";
import { RadioGroupDisabledScene } from "./scenes/RadioGroupDisabledScene";
import { RadioGroupRovingScene } from "./scenes/RadioGroupRovingScene";
import { ScrollAreaBasicScene } from "./scenes/ScrollAreaBasicScene";
import { SelectBasicScene } from "./scenes/SelectBasicScene";
import { SliderBasicScene } from "./scenes/SliderBasicScene";
import { StackShowcaseScene } from "./scenes/StackShowcaseScene";
import { SurfaceShowcaseScene } from "./scenes/SurfaceShowcaseScene";
import { SwitchBasicScene } from "./scenes/SwitchBasicScene";
import { TabsBasicScene } from "./scenes/TabsBasicScene";
import { TextFieldBasicScene } from "./scenes/TextFieldBasicScene";
import { TextareaBasicScene } from "./scenes/TextareaBasicScene";
import { ToastBasicScene } from "./scenes/ToastBasicScene";
import { ToggleGroupBasicScene } from "./scenes/ToggleGroupBasicScene";
import { ToggleGroupRovingScene } from "./scenes/ToggleGroupRovingScene";
import { TooltipDelayScene } from "./scenes/TooltipDelayScene";
import { TooltipFollowScene } from "./scenes/TooltipFollowScene";
import { buttonRecipe, sceneTabRecipe } from "./theme/recipes";

type SceneKey =
  | "dismiss"
  | "nested"
  | "modal"
  | "presence"
  | "inset"
  | "checkbox-basic"
  | "switch-basic"
  | "radio-roving"
  | "radio-disabled"
  | "text-field-basic"
  | "textarea-basic"
  | "select-basic"
  | "combobox-basic"
  | "slider-basic"
  | "progress-basic"
  | "avatar-basic"
  | "toggle-basic"
  | "toggle-roving"
  | "dialog-basic"
  | "dialog-nested"
  | "dialog-modal"
  | "popover-basic"
  | "popover-flip"
  | "popover-nested"
  | "tabs-basic"
  | "tooltip-delay"
  | "tooltip-follow"
  | "menu-roving"
  | "toast-basic"
  | "density-scope"
  | "scroll-area-basic"
  | "surface-showcase"
  | "stack-showcase"
  | "grid-showcase"
  | "accordion-basic";

const sceneOptions = [
  { key: "dismiss", label: "Layer Dismiss" },
  { key: "nested", label: "Nested Stack" },
  { key: "modal", label: "Modal Block" },
  { key: "presence", label: "Presence" },
  { key: "inset", label: "Inset Hit-Test" },
  { key: "checkbox-basic", label: "Checkbox Basic" },
  { key: "switch-basic", label: "Switch Basic" },
  { key: "radio-roving", label: "Radio Roving" },
  { key: "radio-disabled", label: "Radio Disabled" },
  { key: "text-field-basic", label: "TextField Basic" },
  { key: "textarea-basic", label: "Textarea Basic" },
  { key: "select-basic", label: "Select Basic" },
  { key: "combobox-basic", label: "Combobox Basic" },
  { key: "slider-basic", label: "Slider Basic" },
  { key: "progress-basic", label: "Progress Basic" },
  { key: "avatar-basic", label: "Avatar Basic" },
  { key: "toggle-basic", label: "Toggle Basic" },
  { key: "toggle-roving", label: "Toggle Roving" },
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
  { key: "toast-basic", label: "Toast Basic" },
  { key: "density-scope", label: "Density Scope" },
  { key: "scroll-area-basic", label: "ScrollArea Basic" },
  { key: "surface-showcase", label: "Surface Showcase" },
  { key: "stack-showcase", label: "Stack Showcase" },
  { key: "grid-showcase", label: "Grid Showcase" },
  { key: "accordion-basic", label: "Accordion Basic" },
] satisfies ReadonlyArray<{ key: SceneKey; label: string }>;

const densityOrder = ["compact", "comfortable", "spacious"] as const satisfies ReadonlyArray<DensityToken>;

function nextDensity(current: DensityToken): DensityToken {
  const currentIndex = densityOrder.indexOf(current);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  return densityOrder[(normalizedIndex + 1) % densityOrder.size()];
}

type AppProps = {
  playerGui: PlayerGui;
};

function AppContent(props: AppProps) {
  const [activeScene, setActiveScene] = React.useState<SceneKey>("dismiss");
  const [darkMode, setDarkMode] = React.useState(true);
  const { theme, density, setBaseTheme, setDensity } = useSystemTheme();

  React.useEffect(() => {
    setBaseTheme(darkMode ? defaultDarkTheme : defaultLightTheme);
  }, [darkMode, setBaseTheme]);

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
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Text: `Density: ${density}`,
                  Event: {
                    Activated: () => {
                      setDensity(nextDensity(density));
                    },
                  },
                }) as Record<string, unknown>)}
              />
              <Text
                BackgroundTransparency={1}
                LayoutOrder={2}
                Position={UDim2.fromOffset(0, 7)}
                Size={UDim2.fromOffset(420, 24)}
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
            {activeScene === "checkbox-basic" ? <CheckboxBasicScene /> : undefined}
            {activeScene === "switch-basic" ? <SwitchBasicScene /> : undefined}
            {activeScene === "radio-roving" ? <RadioGroupRovingScene /> : undefined}
            {activeScene === "radio-disabled" ? <RadioGroupDisabledScene /> : undefined}
            {activeScene === "text-field-basic" ? <TextFieldBasicScene /> : undefined}
            {activeScene === "textarea-basic" ? <TextareaBasicScene /> : undefined}
            {activeScene === "select-basic" ? <SelectBasicScene /> : undefined}
            {activeScene === "combobox-basic" ? <ComboboxBasicScene /> : undefined}
            {activeScene === "slider-basic" ? <SliderBasicScene /> : undefined}
            {activeScene === "progress-basic" ? <ProgressBasicScene /> : undefined}
            {activeScene === "avatar-basic" ? <AvatarBasicScene /> : undefined}
            {activeScene === "toggle-basic" ? <ToggleGroupBasicScene /> : undefined}
            {activeScene === "toggle-roving" ? <ToggleGroupRovingScene /> : undefined}
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
            {activeScene === "toast-basic" ? <ToastBasicScene /> : undefined}
            {activeScene === "density-scope" ? <DensityScopeScene /> : undefined}
            {activeScene === "scroll-area-basic" ? <ScrollAreaBasicScene /> : undefined}
            {activeScene === "surface-showcase" ? <SurfaceShowcaseScene /> : undefined}
            {activeScene === "stack-showcase" ? <StackShowcaseScene /> : undefined}
            {activeScene === "grid-showcase" ? <GridShowcaseScene /> : undefined}
            {activeScene === "accordion-basic" ? <AccordionBasicScene /> : undefined}
          </frame>
        </frame>
      </screengui>
    </PortalProvider>
  );
}

function App(props: AppProps) {
  return (
    <SystemProvider defaultDensity="comfortable" defaultTheme={defaultDarkTheme}>
      <AppContent playerGui={props.playerGui} />
    </SystemProvider>
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
