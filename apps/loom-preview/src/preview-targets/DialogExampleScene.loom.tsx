import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function DialogExample() {
  const { theme } = useTheme();

  const fields: Array<{ label: string; value: string; offsetY: number }> = [
    { label: "Name", value: "Pedro Duarte", offsetY: 62 },
    { label: "Username", value: "@peduarte", offsetY: 104 },
  ];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
            Size: UDim2.fromOffset(150, 40),
            Text: "Edit profile",
          }) as Record<string, unknown>)}
        />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              AnchorPoint: new Vector2(0.5, 0.5),
              Position: UDim2.fromScale(0.5, 0.5),
              Size: UDim2.fromOffset(420, 226),
              ZIndex: 10,
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding
              PaddingLeft={new UDim(0, theme.space[20])}
              PaddingRight={new UDim(0, theme.space[20])}
              PaddingTop={new UDim(0, theme.space[16])}
            />
            <Text
              BackgroundTransparency={1}
              Size={UDim2.fromOffset(380, 24)}
              Text="Edit profile"
              TextColor3={theme.colors.textPrimary}
              TextSize={theme.typography.titleMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
              ZIndex={11}
            />
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 28)}
              Size={UDim2.fromOffset(380, 20)}
              Text="Make changes to your profile here."
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
              ZIndex={11}
            />
            {fields.map((field) => (
              <frame
                BackgroundTransparency={1}
                key={field.label}
                Position={UDim2.fromOffset(0, field.offsetY)}
                Size={UDim2.fromOffset(380, 34)}
                ZIndex={11}
              >
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(80, 34)}
                  Text={field.label}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  ZIndex={11}
                />
                <frame
                  BackgroundColor3={theme.colors.surface}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(90, 0)}
                  Size={UDim2.fromOffset(290, 34)}
                  ZIndex={11}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                  <uistroke Color={theme.colors.border} Thickness={1} />
                  <Text
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(10, 0)}
                    Size={UDim2.fromOffset(270, 34)}
                    Text={field.value}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                    ZIndex={12}
                  />
                </frame>
              </frame>
            ))}
            <Dialog.Close asChild>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                  Position: UDim2.fromOffset(150, 154),
                  Size: UDim2.fromOffset(90, 36),
                  Text: "Cancel",
                  ZIndex: 11,
                }) as Record<string, unknown>)}
              />
            </Dialog.Close>
            <Dialog.Close asChild>
              <textbutton
                {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                  Position: UDim2.fromOffset(250, 154),
                  Size: UDim2.fromOffset(130, 36),
                  Text: "Save changes",
                  ZIndex: 11,
                }) as Record<string, unknown>)}
              />
            </Dialog.Close>
          </frame>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={40} width={150}>
      <DialogExample />
    </DocExampleShell>
  ),
  title: "Dialog Example",
} as const;
