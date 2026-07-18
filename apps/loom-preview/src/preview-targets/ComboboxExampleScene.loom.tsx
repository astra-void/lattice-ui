import { Combobox } from "@lattice-ui/combobox";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, useTheme } from "@lattice-ui/style";
import { buttonRecipe, menuItemRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

const frameworks = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro"];

function ComboboxExample() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Combobox.Root>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 0)} Size={UDim2.fromOffset(240, 82)}>
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

          <Combobox.Trigger asChild>
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                Size: UDim2.fromOffset(240, 40),
                Text: "",
              }) as Record<string, unknown>)}
            >
              <Combobox.Value asChild placeholder="Select framework">
                <textlabel
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(12, 0)}
                  Size={UDim2.fromOffset(216, 40)}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </Combobox.Value>
            </textbutton>
          </Combobox.Trigger>

          <Combobox.Input asChild placeholder="Search framework...">
            <textbox
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Size={UDim2.fromOffset(240, 36)}
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <uipadding PaddingLeft={new UDim(0, theme.space[8])} PaddingRight={new UDim(0, theme.space[8])} />
            </textbox>
          </Combobox.Input>
        </frame>

        <Combobox.Portal>
          <Combobox.Content asChild placement="bottom" sideOffset={8}>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Size: UDim2.fromOffset(240, 182),
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

              {frameworks.map((framework) => (
                <Combobox.Item asChild key={framework} textValue={framework} value={framework}>
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                      Size: UDim2.fromOffset(224, 30),
                      Text: framework,
                    }) as Record<string, unknown>)}
                  >
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
    <DocExampleShell height={300} width={240}>
      <ComboboxExample />
    </DocExampleShell>
  ),
  title: "Combobox Example",
} as const;
