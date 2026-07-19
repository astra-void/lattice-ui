import { React } from "@lattice-ui/react-runtime";
import { Select } from "@lattice-ui/react-select";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";

import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

const LONG_OPTIONS = [
  "argon",
  "boron",
  "carbon",
  "helium",
  "iodine",
  "krypton",
  "lithium",
  "neon",
  "oxygen",
  "radon",
  "sodium",
  "xenon",
];

function SectionHeader(props: { text: string }) {
  const { theme } = useTheme();
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={0}
      Size={UDim2.fromOffset(860, 20)}
      Text={props.text}
      TextColor3={theme.colors.textSecondary}
      TextSize={theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

function OptionItem(props: { value: string; label?: string; disabled?: boolean; width?: number }) {
  const { theme } = useTheme();
  const label = props.label ?? props.value;
  return (
    <Select.Item asChild disabled={props.disabled} textValue={label} value={props.value}>
      <textbutton
        {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: props.disabled ? "true" : "false" }, theme), {
          Size: UDim2.fromOffset(props.width ?? 296, 30),
          Text: label,
        }) as Record<string, unknown>)}
      >
        <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
      </textbutton>
    </Select.Item>
  );
}

function GroupLabel(props: { text: string }) {
  const { theme } = useTheme();
  return (
    <Select.Label asChild>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(300, 18)}
        Text={props.text}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
    </Select.Label>
  );
}

function TriggerButton(props: { label: string; placeholder: string; disabled?: boolean }) {
  const { theme } = useTheme();
  return (
    <Select.Trigger asChild disabled={props.disabled}>
      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
          Size: UDim2.fromOffset(320, 40),
          Text: "",
        }) as Record<string, unknown>)}
      >
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(12, 0)}
          Size={UDim2.fromOffset(84, 40)}
          Text={props.label}
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Select.Value asChild placeholder={props.placeholder}>
          <textlabel
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(88, 0)}
            Size={UDim2.fromOffset(220, 40)}
            TextColor3={props.disabled ? theme.colors.textSecondary : theme.colors.textPrimary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </Select.Value>
      </textbutton>
    </Select.Trigger>
  );
}

export function SelectBasicScene() {
  const { theme } = useTheme();
  const [controlledOpen, setControlledOpen] = React.useState(false);
  const [controlledValue, setControlledValue] = React.useState("alpha");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 720)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Select: single choice with controlled state and outside dismiss"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Controlled open: ${controlledOpen ? "true" : "false"} | Controlled value: ${controlledValue}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          AutomaticSize: Enum.AutomaticSize.Y,
          Size: UDim2.fromOffset(900, 0),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[16])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[20])} />

        {/* Controlled + grouped options with multiple labels and separators */}
        <frame
          BackgroundTransparency={1}
          AutomaticSize={Enum.AutomaticSize.Y}
          LayoutOrder={1}
          Size={UDim2.fromOffset(860, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader text="Controlled + grouped options" />

          <Select.Root
            onOpenChange={setControlledOpen}
            onValueChange={setControlledValue}
            open={controlledOpen}
            value={controlledValue}
          >
            <TriggerButton label="Mode" placeholder="Pick a mode" />

            <Select.Portal>
              <Select.Content asChild sideOffset={8} placement="bottom">
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                    Size: UDim2.fromOffset(320, 254),
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[8])}
                    PaddingLeft={new UDim(0, theme.space[8])}
                    PaddingRight={new UDim(0, theme.space[8])}
                    PaddingTop={new UDim(0, theme.space[8])}
                  />
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

                  <Select.Group asChild>
                    <frame
                      BackgroundTransparency={1}
                      AutomaticSize={Enum.AutomaticSize.Y}
                      LayoutOrder={1}
                      Size={UDim2.fromOffset(300, 0)}
                    >
                      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
                      <GroupLabel text="Rendering" />
                      <OptionItem value="alpha" />
                      <OptionItem value="beta" />
                      <OptionItem disabled label="gamma (Disabled)" value="gamma" />
                    </frame>
                  </Select.Group>

                  <Select.Separator asChild>
                    <frame
                      BackgroundColor3={theme.colors.border}
                      BorderSizePixel={0}
                      LayoutOrder={2}
                      Size={UDim2.fromOffset(300, 1)}
                    />
                  </Select.Separator>

                  <Select.Group asChild>
                    <frame
                      BackgroundTransparency={1}
                      AutomaticSize={Enum.AutomaticSize.Y}
                      LayoutOrder={3}
                      Size={UDim2.fromOffset(300, 0)}
                    >
                      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
                      <GroupLabel text="Experimental" />
                      <OptionItem value="delta" />
                      <OptionItem value="epsilon" />
                    </frame>
                  </Select.Group>
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </frame>

        {/* Uncontrolled */}
        <frame
          BackgroundTransparency={1}
          AutomaticSize={Enum.AutomaticSize.Y}
          LayoutOrder={2}
          Size={UDim2.fromOffset(860, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader text="Uncontrolled (defaultValue)" />

          <Select.Root defaultValue="beta">
            <TriggerButton label="Quality" placeholder="Pick quality" />

            <Select.Portal>
              <Select.Content asChild sideOffset={8} placement="bottom">
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                    Size: UDim2.fromOffset(320, 126),
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[8])}
                    PaddingLeft={new UDim(0, theme.space[8])}
                    PaddingRight={new UDim(0, theme.space[8])}
                    PaddingTop={new UDim(0, theme.space[8])}
                  />
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                  <OptionItem value="low" />
                  <OptionItem value="beta" />
                  <OptionItem value="high" />
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </frame>

        {/* Long scrolling list (12 items) */}
        <frame
          BackgroundTransparency={1}
          AutomaticSize={Enum.AutomaticSize.Y}
          LayoutOrder={3}
          Size={UDim2.fromOffset(860, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader text="Long list — scrolls inside Content (12 items)" />

          <Select.Root defaultValue="neon">
            <TriggerButton label="Element" placeholder="Pick element" />

            <Select.Portal>
              <Select.Content asChild sideOffset={8} placement="bottom">
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                    Size: UDim2.fromOffset(320, 200),
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[8])}
                    PaddingLeft={new UDim(0, theme.space[8])}
                    PaddingRight={new UDim(0, theme.space[8])}
                    PaddingTop={new UDim(0, theme.space[8])}
                  />

                  <scrollingframe
                    Active
                    AutomaticCanvasSize={Enum.AutomaticSize.Y}
                    BackgroundTransparency={1}
                    BorderSizePixel={0}
                    CanvasSize={new UDim2()}
                    ScrollBarThickness={4}
                    ScrollingDirection={Enum.ScrollingDirection.Y}
                    Size={UDim2.fromScale(1, 1)}
                  >
                    <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />
                    {LONG_OPTIONS.map((option) => (
                      <OptionItem key={option} value={option} width={288} />
                    ))}
                  </scrollingframe>
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </frame>

        {/* Disabled trigger */}
        <frame
          BackgroundTransparency={1}
          AutomaticSize={Enum.AutomaticSize.Y}
          LayoutOrder={4}
          Size={UDim2.fromOffset(860, 0)}
        >
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

          <SectionHeader text="Disabled trigger (cannot open)" />

          <Select.Root defaultValue="beta" disabled>
            <TriggerButton disabled label="Locked" placeholder="Unavailable" />

            <Select.Portal>
              <Select.Content asChild sideOffset={8} placement="bottom">
                <frame
                  {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                    Size: UDim2.fromOffset(320, 96),
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uipadding
                    PaddingBottom={new UDim(0, theme.space[8])}
                    PaddingLeft={new UDim(0, theme.space[8])}
                    PaddingRight={new UDim(0, theme.space[8])}
                    PaddingTop={new UDim(0, theme.space[8])}
                  />
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                  <OptionItem value="alpha" />
                  <OptionItem value="beta" />
                </frame>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </frame>
      </frame>
    </frame>
  );
}
