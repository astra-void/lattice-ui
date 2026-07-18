import { React } from "@lattice-ui/core";
import { Popover } from "@lattice-ui/popover";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function PopoverExample() {
  const { theme } = useTheme();

  const rows: Array<{ label: string; value: string; offsetY: number }> = [
    { label: "Width", value: "100%", offsetY: 30 },
    { label: "Height", value: "25px", offsetY: 66 },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
            Size: UDim2.fromOffset(160, 40),
            Text: "Open popover",
          }) as Record<string, unknown>)}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content asChild placement="bottom" sideOffset={8}>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              Size: UDim2.fromOffset(240, 122),
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding
              PaddingLeft={new UDim(0, theme.space[14])}
              PaddingRight={new UDim(0, theme.space[14])}
              PaddingTop={new UDim(0, theme.space[12])}
            />
            <Text
              BackgroundTransparency={1}
              Size={UDim2.fromOffset(212, 20)}
              Text="Dimensions"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
            {rows.map((row) => (
              <frame
                BackgroundTransparency={1}
                key={row.label}
                Position={UDim2.fromOffset(0, row.offsetY)}
                Size={UDim2.fromOffset(212, 30)}
              >
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(70, 30)}
                  Text={row.label}
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                />
                <frame
                  BackgroundColor3={theme.colors.surface}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(80, 0)}
                  Size={UDim2.fromOffset(132, 30)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                  <uistroke Color={theme.colors.border} Thickness={1} />
                  <Text
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(10, 0)}
                    Size={UDim2.fromOffset(112, 30)}
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
