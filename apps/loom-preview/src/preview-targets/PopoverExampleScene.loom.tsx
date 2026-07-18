import { React } from "@lattice-ui/core";
import { Popover } from "@lattice-ui/popover";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function PopoverExample() {
  const { theme } = useTheme();

  const rows: Array<{ label: string; value: string }> = [
    { label: "Width", value: "100%" },
    { label: "Max. width", value: "300px" },
    { label: "Height", value: "25px" },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
            Size: UDim2.fromOffset(160, 40),
            Text: "Open popover",
            TextSize: theme.typography.labelSm.textSize,
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
          <uistroke Color={theme.colors.border} Thickness={1} />
        </textbutton>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content asChild placement="bottom" sideOffset={8}>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              Size: UDim2.fromOffset(260, 188),
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[16])}
              PaddingLeft={new UDim(0, theme.space[16])}
              PaddingRight={new UDim(0, theme.space[16])}
              PaddingTop={new UDim(0, theme.space[16])}
            />
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

            <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(228, 36)}>
              <Text
                BackgroundTransparency={1}
                Font={Enum.Font.GothamBold}
                Size={UDim2.fromOffset(228, 16)}
                Text="Dimensions"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 20)}
                Size={UDim2.fromOffset(228, 16)}
                Text="Set the dimensions for the layer."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
            </frame>

            {rows.map((row, index) => (
              <frame
                BackgroundTransparency={1}
                key={row.label}
                LayoutOrder={index + 1}
                Size={UDim2.fromOffset(228, 30)}
              >
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(84, 30)}
                  Text={row.label}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <frame
                  BackgroundColor3={theme.colors.surface}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(92, 0)}
                  Size={UDim2.fromOffset(136, 30)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                  <uistroke Color={theme.colors.border} Thickness={1} />
                  <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromScale(1, 1)}
                    Text={row.value}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </frame>
              </frame>
            ))}
          </frame>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={40} width={160}>
      <PopoverExample />
    </DocExampleShell>
  ),
  title: "Popover Example",
} as const;
