import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { buttonRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function DialogExample() {
  const { theme } = useTheme();

  const fields: Array<{ label: string; value: string }> = [
    { label: "Name", value: "Pedro Duarte" },
    { label: "Username", value: "@peduarte" },
  ];

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <textbutton
          {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
            Size: UDim2.fromOffset(150, 40),
            Text: "Edit profile",
            TextSize: theme.typography.labelSm.textSize,
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
          <uistroke Color={theme.colors.border} Thickness={1} />
        </textbutton>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <frame
            {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
              AnchorPoint: new Vector2(0.5, 0.5),
              Position: UDim2.fromScale(0.5, 0.5),
              Size: UDim2.fromOffset(420, 238),
              ZIndex: 10,
            }) as Record<string, unknown>)}
          >
            <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[24])}
              PaddingLeft={new UDim(0, theme.space[24])}
              PaddingRight={new UDim(0, theme.space[24])}
              PaddingTop={new UDim(0, theme.space[24])}
            />
            <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

            <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(372, 40)} ZIndex={11}>
              <Text
                BackgroundTransparency={1}
                Font={Enum.Font.GothamBold}
                Size={UDim2.fromOffset(372, 20)}
                Text="Edit profile"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 24)}
                Size={UDim2.fromOffset(372, 16)}
                Text="Make changes to your profile here."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
            </frame>

            {fields.map((field, index) => (
              <frame
                BackgroundTransparency={1}
                key={field.label}
                LayoutOrder={index + 1}
                Size={UDim2.fromOffset(372, 38)}
                ZIndex={11}
              >
                <Text
                  BackgroundTransparency={1}
                  Font={Enum.Font.GothamMedium}
                  Size={UDim2.fromOffset(90, 38)}
                  Text={field.label}
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  ZIndex={11}
                />
                <frame
                  BackgroundColor3={theme.colors.surface}
                  BorderSizePixel={0}
                  Position={UDim2.fromOffset(100, 0)}
                  Size={UDim2.fromOffset(272, 38)}
                  ZIndex={11}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uistroke Color={theme.colors.border} Thickness={1} />
                  <uipadding PaddingLeft={new UDim(0, theme.space[12])} />
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromScale(1, 1)}
                    Text={field.value}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                    ZIndex={12}
                  />
                </frame>
              </frame>
            ))}

            <frame BackgroundTransparency={1} LayoutOrder={3} Size={UDim2.fromOffset(372, 38)} ZIndex={11}>
              <uilistlayout
                FillDirection={Enum.FillDirection.Horizontal}
                HorizontalAlignment={Enum.HorizontalAlignment.Right}
                Padding={new UDim(0, theme.space[8])}
              />
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    LayoutOrder: 0,
                    Size: UDim2.fromOffset(90, 38),
                    Text: "Cancel",
                    TextSize: theme.typography.labelSm.textSize,
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                  <uistroke Color={theme.colors.border} Thickness={1} />
                </textbutton>
              </Dialog.Close>
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                    LayoutOrder: 1,
                    Size: UDim2.fromOffset(130, 38),
                    Text: "Save changes",
                    TextSize: theme.typography.labelSm.textSize,
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                </textbutton>
              </Dialog.Close>
            </frame>
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
