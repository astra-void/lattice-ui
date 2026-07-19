import { ContextMenu } from "@lattice-ui/react-context-menu";
import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";

import { menuItemRecipe, panelRecipe } from "../theme/recipes";

const actions = [
  { key: "cut", label: "Cut", intent: "default" as const },
  { key: "copy", label: "Copy", intent: "default" as const },
  { key: "paste", label: "Paste", intent: "default" as const },
  { key: "delete", label: "Delete", intent: "danger" as const },
];

export function ContextMenuBasicScene() {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [selection, setSelection] = React.useState("None");

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 560)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Context Menu: right-click a region to open a pointer-anchored menu"
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

      <ContextMenu.Root modal={true} onOpenChange={setOpen} open={open}>
        <ContextMenu.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
              AutoButtonColor: false,
              Position: UDim2.fromOffset(0, 76),
              Size: UDim2.fromOffset(900, 360),
              Text: "Right-click anywhere in this area",
              TextColor3: theme.colors.textSecondary,
              TextSize: theme.typography.bodyMd.textSize,
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
            <uistroke Color={theme.colors.border} Transparency={0.4} Thickness={1} />
          </textbutton>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content asChild placement="bottom">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Size: UDim2.fromOffset(224, 176),
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

              <ContextMenu.Label asChild>
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(208, 20)}
                  Text="Edit"
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
              </ContextMenu.Label>

              <ContextMenu.Group asChild>
                <frame BackgroundTransparency={1} Size={UDim2.fromOffset(208, 128)}>
                  <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[4])} />

                  {actions.map((action) => (
                    <ContextMenu.Item
                      key={action.key}
                      asChild
                      onSelect={() => {
                        setSelection(action.label);
                      }}
                    >
                      <textbutton
                        {...(mergeGuiProps(menuItemRecipe({ intent: action.intent, disabled: "false" }, theme), {
                          Size: UDim2.fromOffset(208, 30),
                          Text: action.label,
                        }) as Record<string, unknown>)}
                      >
                        <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                      </textbutton>
                    </ContextMenu.Item>
                  ))}
                </frame>
              </ContextMenu.Group>
            </frame>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </frame>
  );
}
