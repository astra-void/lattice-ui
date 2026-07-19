import { React } from "@lattice-ui/core";
import { RadioGroup } from "@lattice-ui/radio-group";
import { Select } from "@lattice-ui/select";
import { Slider } from "@lattice-ui/slider";
import type { Theme } from "@lattice-ui/style";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Switch } from "@lattice-ui/switch";
import { TextField } from "@lattice-ui/text-field";

import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

type SwitchRowProps = {
  theme: Theme;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  layoutOrder: number;
};

function SwitchRow(props: SwitchRowProps) {
  const { theme } = props;

  return (
    <frame
      AutomaticSize={Enum.AutomaticSize.Y}
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(560, 0)}
    >
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 2)}
        Size={UDim2.fromOffset(440, 20)}
        Text={props.label}
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 24)}
        Size={UDim2.fromOffset(440, 18)}
        Text={props.description}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Switch.Root asChild checked={props.checked} onCheckedChange={props.onCheckedChange}>
        <textbutton
          AutoButtonColor={false}
          BackgroundColor3={props.checked ? theme.colors.accent : theme.colors.surfaceElevated}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(510, 8)}
          Size={UDim2.fromOffset(46, 24)}
          Text=""
        >
          <uicorner CornerRadius={new UDim(1, 0)} />
          <Switch.Thumb asChild>
            <frame BackgroundColor3={theme.colors.accentContrast} BorderSizePixel={0} Size={UDim2.fromOffset(20, 20)}>
              <uicorner CornerRadius={new UDim(1, 0)} />
            </frame>
          </Switch.Thumb>
        </textbutton>
      </Switch.Root>
    </frame>
  );
}

type SectionProps = {
  theme: Theme;
  title: string;
  layoutOrder: number;
  height?: number;
  children: React.ReactNode;
};

function Section(props: SectionProps) {
  const { theme } = props;

  return (
    <frame
      AutomaticSize={props.height !== undefined ? Enum.AutomaticSize.None : Enum.AutomaticSize.Y}
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(580, props.height ?? 0)}
    >
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />
      <Text
        BackgroundTransparency={1}
        LayoutOrder={0}
        Size={UDim2.fromOffset(580, 18)}
        Text={props.title}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      {props.children}
    </frame>
  );
}

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const densityOptions = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export function SettingsFormScene() {
  const { theme } = useTheme();

  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(false);
  const [themeChoice, setThemeChoice] = React.useState("system");
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [density, setDensity] = React.useState("comfortable");
  const [displayName, setDisplayName] = React.useState("Astra");
  const [volume, setVolume] = React.useState(70);
  const [savedSummary, setSavedSummary] = React.useState<string | undefined>(undefined);

  const nameInvalid = displayName.size() < 2;
  const canSave = !nameInvalid;

  const resolvedTheme = themeOptions.find((option) => option.value === themeChoice)?.label ?? themeChoice;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 700)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Settings form: Switch, Select, RadioGroup, TextField and Slider composed into one panel"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`push=${pushEnabled ? "on" : "off"} | email=${emailEnabled ? "on" : "off"} | theme=${themeChoice} | density=${density} | name="${displayName}" | volume=${math.floor(volume)}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 72),
          Size: UDim2.fromOffset(620, 600),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.35} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[16])}
          PaddingLeft={new UDim(0, theme.space[16])}
          PaddingRight={new UDim(0, theme.space[16])}
          PaddingTop={new UDim(0, theme.space[16])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[20])} />

        <Section theme={theme} title="NOTIFICATIONS" layoutOrder={1}>
          <SwitchRow
            theme={theme}
            label="Push notifications"
            description="Receive alerts on this device."
            checked={pushEnabled}
            onCheckedChange={setPushEnabled}
            layoutOrder={1}
          />
          <SwitchRow
            theme={theme}
            label="Email digest"
            description="A weekly summary sent to your inbox."
            checked={emailEnabled}
            onCheckedChange={setEmailEnabled}
            layoutOrder={2}
          />
        </Section>

        <Section theme={theme} title="APPEARANCE" layoutOrder={2} height={130}>
          <Select.Root onOpenChange={setThemeOpen} onValueChange={setThemeChoice} open={themeOpen} value={themeChoice}>
            <Select.Trigger asChild>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                  LayoutOrder: 1,
                  Size: UDim2.fromOffset(280, 40),
                  Text: "",
                }) as Record<string, unknown>)}
              >
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(12, 0)}
                  Size={UDim2.fromOffset(80, 40)}
                  Text="Theme"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <Select.Value asChild placeholder="Pick theme">
                  <textlabel
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(88, 0)}
                    Size={UDim2.fromOffset(180, 40)}
                    Text={resolvedTheme}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.bodyMd.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Select.Value>
              </textbutton>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content asChild placement="bottom" sideOffset={8}>
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                    Size: UDim2.fromOffset(280, 126),
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.35} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[8])}
                    PaddingLeft={new UDim(0, theme.space[8])}
                    PaddingRight={new UDim(0, theme.space[8])}
                    PaddingTop={new UDim(0, theme.space[8])}
                  />
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                  {themeOptions.map((option) => (
                    <Select.Item key={option.value} asChild textValue={option.label} value={option.value}>
                      <textbutton
                        {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                          Size: UDim2.fromOffset(264, 30),
                          Text: option.label,
                        }) as Record<string, unknown>)}
                      >
                        <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                      </textbutton>
                    </Select.Item>
                  ))}
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          <RadioGroup.Root onValueChange={setDensity} orientation="horizontal" value={density}>
            <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(560, 34)}>
              <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[8])} />
              {densityOptions.map((option) => (
                <RadioGroup.Item key={option.value} asChild value={option.value}>
                  <textbutton
                    {...(mergeGuiProps(
                      buttonRecipe({ intent: density === option.value ? "primary" : "surface", size: "sm" }, theme),
                      {
                        Size: UDim2.fromOffset(170, 34),
                        Text: option.label,
                      },
                    ) as Record<string, unknown>)}
                  />
                </RadioGroup.Item>
              ))}
            </frame>
          </RadioGroup.Root>
        </Section>

        <Section theme={theme} title="PROFILE" layoutOrder={3}>
          <TextField.Root invalid={nameInvalid} onValueChange={setDisplayName} value={displayName}>
            <frame BackgroundTransparency={1} LayoutOrder={1} Size={UDim2.fromOffset(560, 82)}>
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
              <TextField.Label asChild>
                <textbutton
                  AutoButtonColor={false}
                  BackgroundTransparency={1}
                  BorderSizePixel={0}
                  Size={UDim2.fromOffset(560, 20)}
                  Text="Display name"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </TextField.Label>
              <TextField.Input asChild>
                <textbox
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  PlaceholderText="Your name"
                  Size={UDim2.fromOffset(560, 36)}
                  Text={displayName}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uistroke
                    Color={nameInvalid ? theme.colors.danger : theme.colors.border}
                    Thickness={1}
                    Transparency={0.3}
                  />
                  <uipadding PaddingLeft={new UDim(0, theme.space[10])} PaddingRight={new UDim(0, theme.space[10])} />
                </textbox>
              </TextField.Input>
              <TextField.Message asChild>
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(560, 16)}
                  Text={nameInvalid ? "Name must be at least 2 characters." : "Looks good."}
                  TextColor3={nameInvalid ? theme.colors.danger : theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </TextField.Message>
            </frame>
          </TextField.Root>

          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(560, 52)}>
            <Text
              BackgroundTransparency={1}
              Size={UDim2.fromOffset(560, 20)}
              Text={`Volume — ${math.floor(volume)}%`}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            <Slider.Root max={100} min={0} onValueChange={setVolume} step={1} value={volume}>
              <Slider.Track asChild>
                <frame
                  BackgroundColor3={theme.colors.surfaceElevated}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(0, 30)}
                  Size={UDim2.fromOffset(560, 10)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                  <Slider.Range asChild>
                    <frame BackgroundColor3={theme.colors.accent} BorderSizePixel={0}>
                      <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                    </frame>
                  </Slider.Range>
                  <Slider.Thumb asChild>
                    <textbutton
                      AutoButtonColor={false}
                      BackgroundColor3={theme.colors.accentContrast}
                      BorderSizePixel={0}
                      Size={UDim2.fromOffset(18, 18)}
                      Text=""
                    >
                      <uicorner CornerRadius={new UDim(0, theme.radius.full)} />
                    </textbutton>
                  </Slider.Thumb>
                </frame>
              </Slider.Track>
            </Slider.Root>
          </frame>
        </Section>

        <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(580, 44)}>
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            Padding={new UDim(0, theme.space[8])}
            VerticalAlignment={Enum.VerticalAlignment.Center}
          />
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: canSave ? "primary" : "surface", size: "md" }, theme), {
              Active: canSave,
              LayoutOrder: 1,
              Size: UDim2.fromOffset(150, 40),
              Text: "Save changes",
              TextColor3: canSave ? theme.colors.accentContrast : theme.colors.textSecondary,
              Event: {
                Activated: () => {
                  if (!canSave) {
                    return;
                  }
                  setSavedSummary(`Saved · theme ${themeChoice}, density ${density}, volume ${math.floor(volume)}%`);
                },
              },
            }) as Record<string, unknown>)}
          />
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              LayoutOrder: 2,
              Size: UDim2.fromOffset(120, 40),
              Text: "Reset",
              Event: {
                Activated: () => {
                  setPushEnabled(true);
                  setEmailEnabled(false);
                  setThemeChoice("system");
                  setDensity("comfortable");
                  setDisplayName("Astra");
                  setVolume(70);
                  setSavedSummary(undefined);
                },
              },
            }) as Record<string, unknown>)}
          />
        </frame>
      </frame>

      {savedSummary !== undefined ? (
        <frame
          BackgroundColor3={theme.colors.surfaceElevated}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(652, 72)}
          Size={UDim2.fromOffset(280, 72)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
          <uistroke Color={theme.colors.accent} Thickness={1} Transparency={0.3} />
          <uipadding
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[10])}
          />
          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(256, 20)}
            Text="Settings saved"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(0, 24)}
            Size={UDim2.fromOffset(256, 36)}
            Text={savedSummary}
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextWrapped={true}
            TextXAlignment={Enum.TextXAlignment.Left}
            TextYAlignment={Enum.TextYAlignment.Top}
          />
        </frame>
      ) : undefined}
    </frame>
  );
}
