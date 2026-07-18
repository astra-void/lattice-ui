import { React } from "@lattice-ui/core";
import { Select } from "@lattice-ui/select";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, menuItemRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

const fruits = ["Apple", "Banana", "Blueberry", "Grapes", "Pineapple"];

function SelectExample() {
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Select.Root>
        <Select.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              Position: UDim2.fromOffset(0, 0),
              Size: UDim2.fromOffset(240, 40),
              Text: "",
            }) as Record<string, unknown>)}
          >
            <Select.Value asChild placeholder="Select a fruit">
              <textlabel
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(12, 0)}
                Size={UDim2.fromOffset(216, 40)}
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
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Size: UDim2.fromOffset(240, 214),
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

              <Select.Label asChild>
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(224, 18)}
                  Text="Fruits"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </Select.Label>

              {fruits.map((fruit) => (
                <Select.Item asChild key={fruit} textValue={fruit} value={fruit}>
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "false" }, theme), {
                      Size: UDim2.fromOffset(224, 30),
                      Text: fruit,
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
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={280} width={240}>
      <SelectExample />
    </DocExampleShell>
  ),
  title: "Select Example",
} as const;
