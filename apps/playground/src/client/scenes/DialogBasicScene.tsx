import { Dialog } from "@lattice-ui/react-dialog";
import { React } from "@lattice-ui/react-runtime";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/react-style";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function DialogBasicScene() {
  const { theme } = useTheme();
  const [basicOpen, setBasicOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [lastAction, setLastAction] = React.useState("none");

  const openStates = `basic=${basicOpen ? "true" : "false"}  form=${formOpen ? "true" : "false"}  confirm=${confirmOpen ? "true" : "false"}`;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(820, 28)}
        Text="Trigger opens a dialog. Outside click and Close button dismiss."
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(560, 22)}
        Text={`Open: ${openStates}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 56)}
        Size={UDim2.fromOffset(560, 22)}
        Text={`Last confirm action: ${lastAction}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 92)}
        Size={UDim2.fromOffset(400, 20)}
        Text="Variants"
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      {/* Basic dialog */}
      <Dialog.Root modal={false} onOpenChange={setBasicOpen} open={basicOpen}>
        <Dialog.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "md" }, theme), {
              Position: UDim2.fromOffset(0, 118),
              Size: UDim2.fromOffset(170, 42),
              Text: basicOpen ? "Basic Opened" : "Open Basic",
            }) as Record<string, unknown>)}
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Content>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                AnchorPoint: new Vector2(0.5, 0.5),
                Position: UDim2.fromScale(0.5, 0.5),
                Size: UDim2.fromOffset(420, 210),
                ZIndex: 10,
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.4} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[16])}
                PaddingLeft={new UDim(0, theme.space[16])}
                PaddingRight={new UDim(0, theme.space[16])}
                PaddingTop={new UDim(0, theme.space[16])}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 0)}
                Size={UDim2.fromOffset(388, 30)}
                Text="Dialog Basic"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.titleMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 40)}
                Size={UDim2.fromOffset(388, 70)}
                Text="Click outside the content or use the Close button."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
                ZIndex={11}
              />
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    Position: UDim2.fromOffset(0, 132),
                    Size: UDim2.fromOffset(150, 40),
                    Text: "Close Dialog",
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                />
              </Dialog.Close>
            </frame>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Form dialog */}
      <Dialog.Root modal={false} onOpenChange={setFormOpen} open={formOpen}>
        <Dialog.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
              Position: UDim2.fromOffset(186, 118),
              Size: UDim2.fromOffset(170, 42),
              Text: formOpen ? "Form Opened" : "Open Form",
            }) as Record<string, unknown>)}
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Content>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                AnchorPoint: new Vector2(0.5, 0.5),
                Position: UDim2.fromScale(0.5, 0.5),
                Size: UDim2.fromOffset(460, 300),
                ZIndex: 10,
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.4} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[16])}
                PaddingLeft={new UDim(0, theme.space[16])}
                PaddingRight={new UDim(0, theme.space[16])}
                PaddingTop={new UDim(0, theme.space[16])}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 0)}
                Size={UDim2.fromOffset(428, 30)}
                Text="Edit Profile"
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.titleMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 38)}
                Size={UDim2.fromOffset(428, 40)}
                Text="Update the name shown to other players. Changes apply immediately."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
                ZIndex={11}
              />

              {/* Body: labeled field */}
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 92)}
                Size={UDim2.fromOffset(428, 18)}
                Text="Display name"
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <frame
                {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                  Position: UDim2.fromOffset(0, 114),
                  Size: UDim2.fromOffset(428, 44),
                  ZIndex: 11,
                }) as Record<string, unknown>)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.5} />
                <uipadding PaddingLeft={new UDim(0, theme.space[12])} PaddingRight={new UDim(0, theme.space[12])} />
                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromScale(1, 1)}
                  Text="Nimbus_Rider"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  ZIndex={12}
                />
              </frame>

              {/* Footer actions */}
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    Position: UDim2.fromOffset(0, 186),
                    Size: UDim2.fromOffset(140, 40),
                    Text: "Cancel",
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                />
              </Dialog.Close>
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                    Position: UDim2.fromOffset(288, 186),
                    Size: UDim2.fromOffset(140, 40),
                    Text: "Save Changes",
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                />
              </Dialog.Close>
            </frame>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Destructive / confirm dialog */}
      <Dialog.Root modal={false} onOpenChange={setConfirmOpen} open={confirmOpen}>
        <Dialog.Trigger asChild>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "danger", size: "md" }, theme), {
              Position: UDim2.fromOffset(372, 118),
              Size: UDim2.fromOffset(170, 42),
              Text: confirmOpen ? "Confirm Opened" : "Delete Save",
            }) as Record<string, unknown>)}
          />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Content>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "elevated" }, theme), {
                AnchorPoint: new Vector2(0.5, 0.5),
                Position: UDim2.fromScale(0.5, 0.5),
                Size: UDim2.fromOffset(440, 220),
                ZIndex: 10,
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uistroke Color={theme.colors.danger} Thickness={1} Transparency={0.35} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[16])}
                PaddingLeft={new UDim(0, theme.space[16])}
                PaddingRight={new UDim(0, theme.space[16])}
                PaddingTop={new UDim(0, theme.space[16])}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 0)}
                Size={UDim2.fromOffset(408, 30)}
                Text="Delete save file?"
                TextColor3={theme.colors.danger}
                TextSize={theme.typography.titleMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
                ZIndex={11}
              />
              <Text
                BackgroundTransparency={1}
                Position={UDim2.fromOffset(0, 40)}
                Size={UDim2.fromOffset(408, 70)}
                Text="This permanently removes the current progress. This action cannot be undone."
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.bodyMd.textSize}
                TextWrapped={true}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Top}
                ZIndex={11}
              />
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
                    Event: {
                      Activated: () => {
                        setLastAction("cancelled");
                      },
                    },
                    Position: UDim2.fromOffset(0, 140),
                    Size: UDim2.fromOffset(140, 40),
                    Text: "Cancel",
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                />
              </Dialog.Close>
              <Dialog.Close asChild>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "danger", size: "sm" }, theme), {
                    Event: {
                      Activated: () => {
                        setLastAction("deleted");
                      },
                    },
                    Position: UDim2.fromOffset(268, 140),
                    Size: UDim2.fromOffset(140, 40),
                    Text: "Delete",
                    ZIndex: 11,
                  }) as Record<string, unknown>)}
                />
              </Dialog.Close>
            </frame>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </frame>
  );
}
