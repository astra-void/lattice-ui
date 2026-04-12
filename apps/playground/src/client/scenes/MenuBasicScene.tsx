import { React } from "@lattice-ui/core";
import { Menu } from "@lattice-ui/menu";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, menuItemRecipe, panelRecipe } from "../theme/recipes";

const actions = [
  { key: "open", label: "Open File", intent: "default" as const },
  { key: "duplicate", label: "Duplicate", intent: "default" as const },
  { key: "archive", label: "Archive", intent: "default" as const },
  { key: "delete", label: "Delete", intent: "danger" as const },
];

export function MenuBasicScene() {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [selection, setSelection] = React.useState("None");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Menu: grouped items, keyboard navigation, and selection dismissal"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(920, 24)}
        Text={`Open: ${open ? "true" : "false"} | Selected: ${selection}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 76),
          Size: UDim2.fromOffset(900, 300),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[12])}
          PaddingLeft={new UDim(0, theme.space[12])}
          PaddingRight={new UDim(0, theme.space[12])}
          PaddingTop={new UDim(0, theme.space[12])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

        <Menu.Root modal={false} onOpenChange={setOpen} open={open}>
          <Menu.Trigger asChild>
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "md" }, theme), {
                Size: UDim2.fromOffset(200, 42),
                Text: open ? "Menu Open" : "Open Menu",
              }) as Record<string, unknown>)}
            />
          </Menu.Trigger>

          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(860, 22)}
            Text="Arrow keys move through items. Enter or click selects and closes the menu."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />

          <Menu.Portal>
            <Menu.Content asChild offset={new Vector2(0, 8)} placement="bottom">
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                  Size: UDim2.fromOffset(240, 208),
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uistroke Color={theme.colors.border} Transparency={0.35} Thickness={1} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[8])}
                  PaddingLeft={new UDim(0, theme.space[8])}
                  PaddingRight={new UDim(0, theme.space[8])}
                  PaddingTop={new UDim(0, theme.space[8])}
                />
                <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[6])} />

                <Menu.Label asChild>
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromOffset(224, 20)}
                    Text="Actions"
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Menu.Label>

                <Menu.Group asChild>
                  <frame BackgroundTransparency={1} Size={UDim2.fromOffset(224, 128)}>
                    <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                    {actions.map((action) => (
                      <Menu.Item
                        key={action.key}
                        asChild
                        onSelect={() => {
                          setSelection(action.label);
                        }}
                      >
                        <textbutton
                          {...(mergeGuiProps(menuItemRecipe({ intent: action.intent, disabled: "false" }, theme), {
                            Size: UDim2.fromOffset(224, 30),
                            Text: action.label,
                          }) as Record<string, unknown>)}
                        >
                          <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                        </textbutton>
                      </Menu.Item>
                    ))}
                  </frame>
                </Menu.Group>

                <Menu.Separator asChild>
                  <frame BackgroundColor3={theme.colors.border} BorderSizePixel={0} Size={UDim2.fromOffset(224, 1)} />
                </Menu.Separator>

                <Menu.Item
                  asChild
                  disabled={true}
                  onSelect={() => {
                    setSelection("Settings (disabled)");
                  }}
                >
                  <textbutton
                    {...(mergeGuiProps(menuItemRecipe({ intent: "default", disabled: "true" }, theme), {
                      Size: UDim2.fromOffset(224, 30),
                      Text: "Settings (Disabled)",
                    }) as Record<string, unknown>)}
                  >
                    <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                  </textbutton>
                </Menu.Item>
              </frame>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </frame>
    </frame>
  );
}
