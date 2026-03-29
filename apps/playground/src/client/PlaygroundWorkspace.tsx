import { React } from "@lattice-ui/core";
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
import { ModalBlockScene } from "./scenes/ModalBlockScene";
import { NestedStackScene } from "./scenes/NestedStackScene";
import { PopoverBasicScene } from "./scenes/PopoverBasicScene";
import { PopoverFlipClampScene } from "./scenes/PopoverFlipClampScene";
import { PopoverNestedScene } from "./scenes/PopoverNestedScene";
import { PresenceScene } from "./scenes/PresenceScene";
import { ProgressBasicScene } from "./scenes/ProgressBasicScene";
import { RadioGroupDisabledScene } from "./scenes/RadioGroupDisabledScene";
import { ScrollAreaBasicScene } from "./scenes/ScrollAreaBasicScene";
import { SelectBasicScene } from "./scenes/SelectBasicScene";
import { SliderBasicScene } from "./scenes/SliderBasicScene";
import { StackShowcaseScene } from "./scenes/StackShowcaseScene";
import { SurfaceShowcaseScene } from "./scenes/SurfaceShowcaseScene";
import { SwitchBasicScene } from "./scenes/SwitchBasicScene";
import { TabsBasicScene } from "./scenes/TabsBasicScene";
import { TextareaBasicScene } from "./scenes/TextareaBasicScene";
import { TextFieldBasicScene } from "./scenes/TextFieldBasicScene";
import { ToastBasicScene } from "./scenes/ToastBasicScene";
import { ToggleGroupBasicScene } from "./scenes/ToggleGroupBasicScene";
import { TooltipDelayScene } from "./scenes/TooltipDelayScene";
import { TooltipFollowScene } from "./scenes/TooltipFollowScene";
import { buttonRecipe, panelRecipe, sceneTabRecipe } from "./theme/recipes";

export type SceneKey =
  | "dismiss"
  | "nested"
  | "modal"
  | "presence"
  | "inset"
  | "checkbox-basic"
  | "switch-basic"
  | "radio-disabled"
  | "text-field-basic"
  | "textarea-basic"
  | "select-basic"
  | "combobox-basic"
  | "slider-basic"
  | "progress-basic"
  | "avatar-basic"
  | "toggle-basic"
  | "dialog-basic"
  | "dialog-nested"
  | "dialog-modal"
  | "popover-basic"
  | "popover-flip"
  | "popover-nested"
  | "tabs-basic"
  | "tooltip-delay"
  | "tooltip-follow"
  | "toast-basic"
  | "density-scope"
  | "scroll-area-basic"
  | "surface-showcase"
  | "stack-showcase"
  | "grid-showcase"
  | "accordion-basic";

type SceneCategory = "Layering" | "Forms" | "Selection" | "Showcase";

type SceneOption = {
  key: SceneKey;
  label: string;
  description: string;
  category: SceneCategory;
};

const sceneOptions = [
  {
    key: "dismiss",
    label: "Layer Dismiss",
    description: "Outside click dismissal orchestration.",
    category: "Layering",
  },
  {
    key: "nested",
    label: "Nested Stack",
    description: "Layer ownership and nested portal behavior.",
    category: "Layering",
  },
  {
    key: "modal",
    label: "Modal Block",
    description: "Modal surfaces with outside interaction blocking.",
    category: "Layering",
  },
  {
    key: "presence",
    label: "Presence",
    description: "Mount and unmount transitions with presence states.",
    category: "Layering",
  },
  {
    key: "inset",
    label: "Inset Hit-Test",
    description: "Pointer hit region tuning for small controls.",
    category: "Layering",
  },
  {
    key: "dialog-basic",
    label: "Dialog Basic",
    description: "Core dialog primitives and focus handoff.",
    category: "Layering",
  },
  {
    key: "dialog-nested",
    label: "Dialog Nested",
    description: "Nested dialog sequencing and layering.",
    category: "Layering",
  },
  {
    key: "dialog-modal",
    label: "Dialog Modal Block",
    description: "Modal dialog that locks external interaction.",
    category: "Layering",
  },
  {
    key: "popover-basic",
    label: "Popover Basic",
    description: "Anchored popover positioning with portals.",
    category: "Layering",
  },
  {
    key: "popover-flip",
    label: "Popover Flip/Clamp",
    description: "Viewport-aware popover fallback placement.",
    category: "Layering",
  },
  {
    key: "popover-nested",
    label: "Popover Nested",
    description: "Layer stack behavior with nested popovers.",
    category: "Layering",
  },
  {
    key: "tooltip-delay",
    label: "Tooltip Delay",
    description: "Open/close delay behavior for tooltips.",
    category: "Layering",
  },
  {
    key: "tooltip-follow",
    label: "Tooltip Follow",
    description: "Tooltip movement following pointer position.",
    category: "Layering",
  },
  {
    key: "toast-basic",
    label: "Toast Basic",
    description: "Declarative toast composition examples.",
    category: "Layering",
  },
  {
    key: "checkbox-basic",
    label: "Checkbox Basic",
    description: "Checkbox states and controlled usage.",
    category: "Forms",
  },
  {
    key: "switch-basic",
    label: "Switch Basic",
    description: "Switch interactions and state labels.",
    category: "Forms",
  },
  {
    key: "text-field-basic",
    label: "TextField Basic",
    description: "Single-line text input variants.",
    category: "Forms",
  },
  {
    key: "textarea-basic",
    label: "Textarea Basic",
    description: "Multi-line input and helper text.",
    category: "Forms",
  },
  {
    key: "select-basic",
    label: "Select Basic",
    description: "Trigger/content select composition.",
    category: "Forms",
  },
  {
    key: "combobox-basic",
    label: "Combobox Basic",
    description: "Text input with option filtering behavior.",
    category: "Forms",
  },
  {
    key: "slider-basic",
    label: "Slider Basic",
    description: "Single and range slider interaction.",
    category: "Forms",
  },
  {
    key: "progress-basic",
    label: "Progress Basic",
    description: "Progress indicators with semantic states.",
    category: "Forms",
  },
  {
    key: "avatar-basic",
    label: "Avatar Basic",
    description: "Avatar fallbacks, sizing and status.",
    category: "Forms",
  },
  {
    key: "radio-disabled",
    label: "Radio Disabled",
    description: "Disabled radio behavior and focus rules.",
    category: "Selection",
  },
  {
    key: "toggle-basic",
    label: "Toggle Basic",
    description: "Single toggle pressed state behavior.",
    category: "Selection",
  },
  {
    key: "tabs-basic",
    label: "Tabs Basic",
    description: "Tabs activation, indicators and content.",
    category: "Selection",
  },
  {
    key: "accordion-basic",
    label: "Accordion Basic",
    description: "Expandable sections with animated disclosure.",
    category: "Selection",
  },
  {
    key: "density-scope",
    label: "Density Scope",
    description: "Per-scope density overrides across components.",
    category: "Showcase",
  },
  {
    key: "scroll-area-basic",
    label: "ScrollArea Basic",
    description: "Custom XY viewport and thumb composition.",
    category: "Showcase",
  },
  {
    key: "surface-showcase",
    label: "Surface Showcase",
    description: "Surface tone tokens and elevation structure.",
    category: "Showcase",
  },
  {
    key: "stack-showcase",
    label: "Stack Showcase",
    description: "Vertical composition and spacing primitives.",
    category: "Showcase",
  },
  {
    key: "grid-showcase",
    label: "Grid Showcase",
    description: "Grid composition and responsive track setup.",
    category: "Showcase",
  },
] satisfies ReadonlyArray<SceneOption>;

const sceneCategories = [
  { key: "Layering", label: "Layering & Overlays" },
  { key: "Forms", label: "Forms & Inputs" },
  { key: "Selection", label: "Selection Patterns" },
  { key: "Showcase", label: "System & Layout" },
] as const satisfies ReadonlyArray<{ key: SceneCategory; label: string }>;

const scenesByCategory = sceneCategories.map((category) => ({
  key: category.key,
  label: category.label,
  scenes: sceneOptions.filter((scene) => scene.category === category.key),
}));

const sceneComponents = {
  dismiss: LayerDismissScene,
  nested: NestedStackScene,
  modal: ModalBlockScene,
  presence: PresenceScene,
  inset: InsetHitTestScene,
  "checkbox-basic": CheckboxBasicScene,
  "switch-basic": SwitchBasicScene,
  "radio-disabled": RadioGroupDisabledScene,
  "text-field-basic": TextFieldBasicScene,
  "textarea-basic": TextareaBasicScene,
  "select-basic": SelectBasicScene,
  "combobox-basic": ComboboxBasicScene,
  "slider-basic": SliderBasicScene,
  "progress-basic": ProgressBasicScene,
  "avatar-basic": AvatarBasicScene,
  "toggle-basic": ToggleGroupBasicScene,
  "dialog-basic": DialogBasicScene,
  "dialog-nested": DialogNestedScene,
  "dialog-modal": DialogModalBlockScene,
  "popover-basic": PopoverBasicScene,
  "popover-flip": PopoverFlipClampScene,
  "popover-nested": PopoverNestedScene,
  "tabs-basic": TabsBasicScene,
  "tooltip-delay": TooltipDelayScene,
  "tooltip-follow": TooltipFollowScene,
  "toast-basic": ToastBasicScene,
  "density-scope": DensityScopeScene,
  "scroll-area-basic": ScrollAreaBasicScene,
  "surface-showcase": SurfaceShowcaseScene,
  "stack-showcase": StackShowcaseScene,
  "grid-showcase": GridShowcaseScene,
  "accordion-basic": AccordionBasicScene,
} satisfies Record<SceneKey, () => React.ReactNode>;

const densityOrder = ["compact", "comfortable", "spacious"] as const satisfies ReadonlyArray<DensityToken>;

function nextDensity(current: DensityToken): DensityToken {
  const currentIndex = densityOrder.indexOf(current);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
  return densityOrder[(normalizedIndex + 1) % densityOrder.size()];
}

export type PlaygroundWorkspaceProps = {
  playerGui: PlayerGui;
  initialScene?: SceneKey;
};

function AppContent(props: PlaygroundWorkspaceProps) {
  const [activeScene, setActiveScene] = React.useState<SceneKey>(props.initialScene ?? "dismiss");
  const [darkMode, setDarkMode] = React.useState(true);
  const { theme, density, setBaseTheme, setDensity } = useSystemTheme();
  const activeSceneMeta = sceneOptions.find((scene) => scene.key === activeScene) ?? sceneOptions[0];
  const ActiveScene = sceneComponents[activeScene];

  React.useEffect(() => {
    setBaseTheme(darkMode ? defaultDarkTheme : defaultLightTheme);
  }, [darkMode, setBaseTheme]);

  const outerPadding = theme.space[16];
  const headerHeight = 104;
  const navWidth = 280;
  const panelGap = theme.space[12];

  return (
    <PortalProvider container={props.playerGui}>
      <screengui IgnoreGuiInset={true} ResetOnSpawn={false}>
        <frame
          BackgroundColor3={theme.colors.background}
          BorderSizePixel={0}
          Position={UDim2.fromScale(0, 0)}
          Size={UDim2.fromScale(1, 1)}
        >
          <uigradient
            Color={
              new ColorSequence([
                new ColorSequenceKeypoint(0, theme.colors.background),
                new ColorSequenceKeypoint(1, theme.colors.surfaceElevated),
              ])
            }
            Rotation={90}
          />

          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
              Position: UDim2.fromOffset(outerPadding, outerPadding),
              Size: new UDim2(1, -outerPadding * 2, 0, headerHeight),
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
            <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.25} />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[12])}
              PaddingLeft={new UDim(0, theme.space[16])}
              PaddingRight={new UDim(0, theme.space[16])}
              PaddingTop={new UDim(0, theme.space[12])}
            />

            <frame BackgroundTransparency={1} Size={new UDim2(1, -266, 1, 0)}>
              <Text
                BackgroundTransparency={1}
                Size={new UDim2(1, 0, 0, 30)}
                Text="Lattice UI Playground"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.titleMd.textSize + 4}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 36)}
                Size={new UDim2(1, 0, 0, 22)}
                Text={`${activeSceneMeta.category} / ${activeSceneMeta.description}`}
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextTruncate={Enum.TextTruncate.AtEnd}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 60)}
                Size={new UDim2(1, 0, 0, 18)}
                Text={`Active Scene: ${activeSceneMeta.label}`}
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>

            <frame BackgroundTransparency={1} Position={new UDim2(1, -250, 0, 0)} Size={UDim2.fromOffset(250, 80)}>
              <uilistlayout
                FillDirection={Enum.FillDirection.Horizontal}
                HorizontalAlignment={Enum.HorizontalAlignment.Right}
                Padding={new UDim(0, theme.space[8])}
                VerticalAlignment={Enum.VerticalAlignment.Center}
              />
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                  Text: darkMode ? "Theme: Dark" : "Theme: Light",
                  Event: {
                    Activated: () => {
                      setDarkMode((value) => !value);
                    },
                  },
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              </textbutton>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Text: `Density: ${density}`,
                  Event: {
                    Activated: () => {
                      setDensity(nextDensity(density));
                    },
                  },
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.4} />
              </textbutton>
            </frame>
          </frame>

          <frame
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(outerPadding, outerPadding * 2 + headerHeight)}
            Size={new UDim2(1, -outerPadding * 2, 1, -(outerPadding * 3 + headerHeight))}
          >
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Size: new UDim2(0, navWidth, 1, 0),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.35} />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(theme.space[12], theme.space[10])}
                Size={new UDim2(1, -theme.space[24], 0, 20)}
                Text="Scene Navigator"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize + 1}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(theme.space[12], 30)}
                Size={new UDim2(1, -theme.space[24], 0, 18)}
                Text={`${sceneOptions.size()} scenes`}
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <scrollingframe
                AutomaticCanvasSize={Enum.AutomaticSize.Y}
                BackgroundTransparency={1}
                BorderSizePixel={0}
                CanvasSize={UDim2.fromOffset(0, 0)}
                Position={UDim2.fromOffset(theme.space[8], 58)}
                ScrollBarImageColor3={theme.colors.border}
                ScrollBarImageTransparency={0.3}
                ScrollBarThickness={6}
                ScrollingDirection={Enum.ScrollingDirection.Y}
                Size={new UDim2(1, -theme.space[16], 1, -66)}
              >
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

                {scenesByCategory.map((category) => (
                  <frame
                    key={category.key}
                    AutomaticSize={Enum.AutomaticSize.Y}
                    BackgroundTransparency={1}
                    Size={new UDim2(1, 0, 0, 0)}
                  >
                    <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />
                    <Text
                      BackgroundTransparency={1}
                      LayoutOrder={1}
                      Size={new UDim2(1, -4, 0, 20)}
                      Text={category.label}
                      TextColor3={theme.colors.textSecondary}
                      TextSize={theme.typography.labelSm.textSize}
                      TextXAlignment={Enum.TextXAlignment.Left}
                    />
                    {category.scenes.map((scene) => {
                      const selected = scene.key === activeScene;

                      return (
                        <textbutton
                          key={scene.key}
                          {...(mergeGuiProps(sceneTabRecipe({ selected: selected ? "true" : "false" }, theme), {
                            LayoutOrder: 2,
                            Size: new UDim2(1, -4, 0, 32),
                            Text: scene.label,
                            TextXAlignment: Enum.TextXAlignment.Left,
                            Event: {
                              Activated: () => {
                                setActiveScene(scene.key);
                              },
                            },
                          }) as Record<string, unknown>)}
                        >
                          <uipadding
                            PaddingLeft={new UDim(0, theme.space[10])}
                            PaddingRight={new UDim(0, theme.space[10])}
                          />
                          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                          <uistroke
                            Color={selected ? theme.colors.accent : theme.colors.border}
                            Thickness={1}
                            Transparency={selected ? 0.2 : 0.45}
                          />
                        </textbutton>
                      );
                    })}
                  </frame>
                ))}
              </scrollingframe>
            </frame>

            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                Position: UDim2.fromOffset(navWidth + panelGap, 0),
                Size: new UDim2(1, -(navWidth + panelGap), 1, 0),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.35} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[12])}
                PaddingLeft={new UDim(0, theme.space[12])}
                PaddingRight={new UDim(0, theme.space[12])}
                PaddingTop={new UDim(0, theme.space[12])}
              />
              <frame BackgroundTransparency={1} Size={new UDim2(1, 0, 0, 62)}>
                <Text
                  BackgroundTransparency={1}
                  Size={new UDim2(1, -150, 0, 26)}
                  Text={activeSceneMeta.label}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.titleMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 28)}
                  Size={new UDim2(1, -12, 0, 18)}
                  Text={activeSceneMeta.description}
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextTruncate={Enum.TextTruncate.AtEnd}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={new UDim2(1, -144, 0, 0)}
                  Size={UDim2.fromOffset(144, 26)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.4} />
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromScale(1, 1)}
                    Text={activeSceneMeta.category}
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                  />
                </frame>
              </frame>

              <frame
                BackgroundColor3={theme.colors.surface}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(0, 70)}
                Size={new UDim2(1, 0, 1, -70)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
                <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
                  <ActiveScene />
                </frame>
              </frame>
            </frame>
          </frame>
        </frame>
      </screengui>
    </PortalProvider>
  );
}

export function PlaygroundWorkspace(props: PlaygroundWorkspaceProps) {
  return (
    <SystemProvider defaultDensity="comfortable" defaultTheme={defaultDarkTheme}>
      <AppContent playerGui={props.playerGui} />
    </SystemProvider>
  );
}
