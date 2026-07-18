import { Combobox } from "@lattice-ui/combobox";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { menuItemRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

const frameworks = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro"];

function ComboboxExample() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Combobox.Root>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 0)} Size={UDim2.fromOffset(240, 110)}>
          <Text
            BackgroundTransparency={1}
            Font={Enum.Font.GothamMedium}
            Size={UDim2.fromOffset(240, 16)}
            Text="Framework"
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />

          <Combobox.Trigger asChild>
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
              <Combobox.Value asChild placeholder="Select framework">
                <textlabel
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(12, 0)}
                  Size={UDim2.fromOffset(196, 40)}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </Combobox.Value>
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(212, 0)}
                Size={UDim2.fromOffset(16, 40)}
                Text="▾"
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
              />
            </textbutton>
          </Combobox.Trigger>

          <Combobox.Input asChild placeholder="Search framework…">
            <textbox
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              ClearTextOnFocus={false}
              PlaceholderColor3={theme.colors.textSecondary}
              Position={UDim2.fromOffset(0, 72)}
              Size={UDim2.fromOffset(240, 38)}
              Text=""
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.labelSm.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <uistroke Color={theme.colors.border} Thickness={1} />
              <uipadding PaddingLeft={new UDim(0, theme.space[12])} PaddingRight={new UDim(0, theme.space[12])} />
            </textbox>
          </Combobox.Input>
        </frame>

        <Combobox.Portal>
          <Combobox.Content asChild placement="bottom" sideOffset={6}>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                Size: UDim2.fromOffset(240, 184),
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

              {frameworks.map((framework) => (
                <Combobox.Item asChild key={framework} textValue={framework} value={framework}>
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                      Size: UDim2.fromOffset(228, 32),
                      Text: framework,
                    }) as Record<string, unknown>)}
                  >
                    <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                    <uipadding PaddingLeft={new UDim(0, theme.space[8])} />
                  </textbutton>
                </Combobox.Item>
              ))}
            </frame>
          </Combobox.Content>
        </Combobox.Portal>
      </Combobox.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={310} width={240}>
      <ComboboxExample />
    </DocExampleShell>
  ),
  title: "Combobox Example",
} as const;
