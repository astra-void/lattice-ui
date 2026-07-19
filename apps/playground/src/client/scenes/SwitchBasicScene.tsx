import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";
import { Switch } from "@lattice-ui/react-switch";

import { panelRecipe } from "../theme/recipes";

type Theme = ReturnType<typeof useTheme>["theme"];

function toSwitchLabel(checked: boolean) {
  return checked ? "on" : "off";
}

function SectionHeader(props: { theme: Theme; text: string; order: number }) {
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(860, 18)}
      Text={props.text}
      TextColor3={props.theme.colors.textSecondary}
      TextSize={props.theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

/** A settings row: title + description on the left, a consumer-owned switch on the right. */
function SettingRow(props: {
  theme: Theme;
  order: number;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const { theme } = props;
  const trackColor = props.disabled
    ? theme.colors.surfaceElevated
    : props.checked
      ? theme.colors.accent
      : theme.colors.surfaceElevated;
  const titleColor = props.disabled ? theme.colors.textSecondary : theme.colors.textPrimary;

  return (
    <frame BackgroundTransparency={1} LayoutOrder={props.order} Size={UDim2.fromOffset(610, 46)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 2)}
        Size={UDim2.fromOffset(540, 20)}
        Text={props.title}
        TextColor3={titleColor}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 24)}
        Size={UDim2.fromOffset(540, 18)}
        Text={props.description}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Switch.Root asChild checked={props.checked} disabled={props.disabled} onCheckedChange={props.onCheckedChange}>
        <textbutton
          AnchorPoint={new Vector2(1, 0.5)}
          AutoButtonColor={false}
          BackgroundColor3={trackColor}
          BorderSizePixel={0}
          Position={new UDim2(1, 0, 0.5, 0)}
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

const SETTINGS = [
  { title: "Wi-Fi", description: "Connect to available networks automatically" },
  { title: "Bluetooth", description: "Discoverable while settings is open" },
  { title: "Airplane mode", description: "Disable all wireless radios" },
];

export function SwitchBasicScene() {
  const { theme } = useTheme();
  const [passthroughStyled, setPassthroughStyled] = React.useState(false);
  const [asChildStyled, setAsChildStyled] = React.useState(false);
  const [settings, setSettings] = React.useState<Array<boolean>>([true, false, false]);

  const enabledCount = settings.filter((value) => value).size();

  const setSettingAt = React.useCallback((index: number, nextValue: boolean) => {
    setSettings((current) => current.map((value, i) => (i === index ? nextValue : value)));
  }, []);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 620)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(860, 28)}
        Text="Switch: settings rows + consumer-owned styling (passthrough props vs asChild)"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(860, 22)}
        Text={`Passthrough-styled: ${toSwitchLabel(passthroughStyled)} | asChild-styled: ${toSwitchLabel(asChildStyled)} | Settings enabled ${enabledCount}/${settings.size()}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 68)} Size={UDim2.fromOffset(920, 540)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[16])} />

        {/* Settings list */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 1,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(640, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

          <SectionHeader theme={theme} text="SETTINGS" order={1} />
          {settings.map((enabled, index) => (
            <SettingRow
              key={`setting-${index}`}
              theme={theme}
              order={2 + index}
              title={SETTINGS[index].title}
              description={SETTINGS[index].description}
              checked={enabled}
              onCheckedChange={(nextChecked) => {
                setSettingAt(index, nextChecked);
              }}
            />
          ))}
          <SettingRow
            theme={theme}
            order={20}
            title="Developer mode"
            description="Locked by administrator"
            checked={true}
            disabled
          />
        </frame>

        {/* Consumer-owned styling: passthrough props vs asChild */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 2,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(640, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader theme={theme} text="CONSUMER-OWNED STYLING" order={1} />

          {/*
            The primitive is unstyled: it neutralizes Roblox instance defaults and nothing else.
            Every color below is picked by this scene from the current `checked`/`disabled` state.
            Route 1 - style the primitive's own instances with plain instance props.
          */}
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(610, 44)}>
            <Switch.Root
              BackgroundColor3={passthroughStyled ? theme.colors.accent : theme.colors.surfaceElevated}
              BackgroundTransparency={0}
              checked={passthroughStyled}
              onCheckedChange={setPassthroughStyled}
              Position={UDim2.fromOffset(0, 10)}
              Size={UDim2.fromOffset(46, 24)}
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <Switch.Thumb
                BackgroundColor3={theme.colors.accentContrast}
                BackgroundTransparency={0}
                Size={UDim2.fromOffset(20, 20)}
              >
                <uicorner CornerRadius={new UDim(1, 0)} />
              </Switch.Thumb>
            </Switch.Root>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(56, 0)}
              Size={UDim2.fromOffset(540, 44)}
              Text={`Passthrough props on the primitive: ${toSwitchLabel(passthroughStyled)}`}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </frame>

          {/* Route 2 - hand the primitive your own instances with `asChild`. */}
          <frame BackgroundTransparency={1} LayoutOrder={3} Size={UDim2.fromOffset(610, 44)}>
            <Switch.Root asChild checked={asChildStyled} onCheckedChange={setAsChildStyled}>
              <textbutton
                AutoButtonColor={false}
                BackgroundColor3={asChildStyled ? theme.colors.accent : theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(0, 10)}
                Size={UDim2.fromOffset(46, 24)}
                Text=""
              >
                <uicorner CornerRadius={new UDim(1, 0)} />
                <Switch.Thumb asChild>
                  <frame
                    BackgroundColor3={theme.colors.accentContrast}
                    BorderSizePixel={0}
                    Size={UDim2.fromOffset(20, 20)}
                  >
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </Switch.Thumb>
              </textbutton>
            </Switch.Root>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(56, 0)}
              Size={UDim2.fromOffset(540, 44)}
              Text={`asChild with your own instances: ${toSwitchLabel(asChildStyled)}`}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </frame>

          {/* `disabled` is behavior only - the muted palette is this scene's choice. */}
          <frame BackgroundTransparency={1} LayoutOrder={4} Size={UDim2.fromOffset(610, 44)}>
            <Switch.Root asChild checked={true} disabled>
              <textbutton
                AutoButtonColor={false}
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Position={UDim2.fromOffset(0, 10)}
                Size={UDim2.fromOffset(46, 24)}
                Text=""
              >
                <uicorner CornerRadius={new UDim(1, 0)} />
                <Switch.Thumb asChild>
                  <frame
                    BackgroundColor3={theme.colors.textSecondary}
                    BorderSizePixel={0}
                    Size={UDim2.fromOffset(20, 20)}
                  >
                    <uicorner CornerRadius={new UDim(1, 0)} />
                  </frame>
                </Switch.Thumb>
              </textbutton>
            </Switch.Root>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(56, 0)}
              Size={UDim2.fromOffset(540, 44)}
              Text="Disabled: the consumer supplies the muted palette"
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </frame>
        </frame>
      </frame>
    </frame>
  );
}
