import { React } from "@lattice-ui/core";
import { Select } from "@lattice-ui/select";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

const sounds = ["Chime", "Echo", "Pulse", "Ripple", "Off"];

function SelectExample() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Text
        BackgroundTransparency={1}
        Font={Enum.Font.GothamMedium}
        Size={UDim2.fromOffset(240, 16)}
        Text="Notification sound"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Select.Root>
        <Select.Trigger asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(0, 24)}
            Size={UDim2.fromOffset(240, 40)}
            Text=""
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <Select.Value asChild placeholder="Select a sound">
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(12, 0)}
                Size={UDim2.fromOffset(196, 40)}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </Select.Value>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(212, 0)}
              Size={UDim2.fromOffset(16, 40)}
              Text="▾"
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
            />
          </textbutton>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content asChild placement="bottom" sideOffset={6}>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                Size: UDim2.fromOffset(240, 208),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <uistroke Color={theme.colors.border} Thickness={1} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[6])}
                PaddingLeft={new UDim(0, theme.space[6])}
                PaddingRight={new UDim(0, theme.space[6])}
                PaddingTop={new UDim(0, theme.space[6])}
              />
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[2])} />

              <Select.Label asChild>
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(228, 24)}
                  Text="Sounds"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                >
                  <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                </Text>
              </Select.Label>

              {sounds.map((sound) => (
                <Select.Item asChild key={sound} textValue={sound} value={sound}>
                  <textbutton
                    AutoButtonColor={false}
                    BackgroundTransparency={1}
                    BorderSizePixel={0}
                    Size={UDim2.fromOffset(228, 32)}
                    Text={sound}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  >
                    <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                    <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                  </textbutton>
                </Select.Item>
              ))}
            </frame>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={290} width={240}>
      <SelectExample />
    </DocExampleShell>
  ),
  title: "Select Example",
} as const;
