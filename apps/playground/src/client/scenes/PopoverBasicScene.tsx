import { React } from "@lattice-ui/core";
import { Popover } from "@lattice-ui/popover";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function PopoverBasicScene() {
  const [open, setOpen] = React.useState(false);
  const { theme } = useTheme();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(760, 28)}
        Text="Trigger click opens popover. Outside click dismisses it."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(300, 24)}
        Text={`Open: ${open ? "true" : "false"}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Popover.Root onOpenChange={setOpen} open={open}>
        <Popover.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "md" }, theme), {
              Position: UDim2.fromOffset(0, 72),
              Size: UDim2.fromOffset(180, 42),
              Text: open ? "Opened" : "Toggle Popover",
            }) as Record<string, unknown>)}
          />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content asChild sideOffset={10} placement="bottom">
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Size: UDim2.fromOffset(300, 180),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uipadding
                PaddingLeft={new UDim(0, theme.space[14])}
                PaddingRight={new UDim(0, theme.space[14])}
                PaddingTop={new UDim(0, theme.space[12])}
              />
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(260, 28)}
                Text="Popover Basic"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.titleMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 34)}
                Size={UDim2.fromOffset(270, 56)}
                Text="Outside click closes this panel."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
              />
              <Popover.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    Position: UDim2.fromOffset(0, 112),
                    Size: UDim2.fromOffset(130, 36),
                    Text: "Close",
                  }) as Record<string, unknown>)}
                />
              </Popover.Close>
            </frame>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </frame>
  );
}
