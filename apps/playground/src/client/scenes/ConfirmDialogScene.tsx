import { React } from "@lattice-ui/core";
import { Dialog } from "@lattice-ui/dialog";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

export function ConfirmDialogScene() {
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const [confirmCount, setConfirmCount] = React.useState(0);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(900, 28)}
        Text="Confirm dialog: modal destructive flow with Cancel / Delete and a result banner"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <Text
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 34)}
        Size={UDim2.fromOffset(900, 24)}
        Text={`open=${open ? "true" : "false"} | project=${deleted ? "deleted" : "active"} | confirms=${confirmCount}`}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.bodyMd.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 72),
          Size: UDim2.fromOffset(560, 200),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.35} />
        <uipadding
          PaddingLeft={new UDim(0, theme.space[16])}
          PaddingRight={new UDim(0, theme.space[16])}
          PaddingTop={new UDim(0, theme.space[16])}
        />

        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromOffset(520, 22)}
          Text="Project: Aurora"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 26)}
          Size={UDim2.fromOffset(520, 20)}
          Text={deleted ? "This project has been deleted." : "Deleting a project cannot be undone."}
          TextColor3={deleted ? theme.colors.danger : theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />

        <Dialog.Root modal={true} onOpenChange={setOpen} open={open}>
          <Dialog.Trigger asChild>
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: deleted ? "surface" : "danger", size: "md" }, theme), {
                Active: !deleted,
                Position: UDim2.fromOffset(0, 64),
                Size: UDim2.fromOffset(180, 42),
                Text: deleted ? "Already deleted" : "Delete project",
                TextColor3: deleted ? theme.colors.textSecondary : theme.colors.dangerContrast,
              }) as Record<string, unknown>)}
            />
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Content>
              <frame
                AnchorPoint={new Vector2(0.5, 0.5)}
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Position={UDim2.fromScale(0.5, 0.5)}
                Size={UDim2.fromOffset(440, 236)}
                ZIndex={10}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
                <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.25} />
                <uipadding
                  PaddingBottom={new UDim(0, theme.space[16])}
                  PaddingLeft={new UDim(0, theme.space[20])}
                  PaddingRight={new UDim(0, theme.space[20])}
                  PaddingTop={new UDim(0, theme.space[16])}
                />

                <Text
                  BackgroundTransparency={1}
                  Size={UDim2.fromOffset(400, 28)}
                  Text="Delete project?"
                  TextColor3={theme.colors.textPrimary}
                  TextSize={theme.typography.titleMd.textSize}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  ZIndex={11}
                />
                <Text
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 40)}
                  Size={UDim2.fromOffset(400, 72)}
                  Text="This permanently removes “Aurora” and all of its data. This action cannot be undone."
                  TextColor3={theme.colors.textSecondary}
                  TextSize={theme.typography.bodyMd.textSize}
                  TextWrapped={true}
                  TextXAlignment={Enum.TextXAlignment.Left}
                  TextYAlignment={Enum.TextYAlignment.Top}
                  ZIndex={11}
                />

                <frame
                  BackgroundTransparency={1}
                  Position={UDim2.fromOffset(0, 148)}
                  Size={UDim2.fromOffset(400, 44)}
                  ZIndex={11}
                >
                  <uilistlayout
                    FillDirection={Enum.FillDirection.Horizontal}
                    HorizontalAlignment={Enum.HorizontalAlignment.Right}
                    Padding={new UDim(0, theme.space[8])}
                    VerticalAlignment={Enum.VerticalAlignment.Center}
                  />
                  <Dialog.Close asChild>
                    <textbutton
                      {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
                        LayoutOrder: 1,
                        Size: UDim2.fromOffset(120, 40),
                        Text: "Cancel",
                        ZIndex: 11,
                      }) as Record<string, unknown>)}
                    />
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <textbutton
                      {...(mergeGuiProps(buttonRecipe({ intent: "danger", size: "md" }, theme), {
                        LayoutOrder: 2,
                        Size: UDim2.fromOffset(150, 40),
                        Text: "Delete project",
                        ZIndex: 11,
                        Event: {
                          Activated: () => {
                            setDeleted(true);
                            setConfirmCount((count) => count + 1);
                          },
                        },
                      }) as Record<string, unknown>)}
                    />
                  </Dialog.Close>
                </frame>
              </frame>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </frame>

      {deleted ? (
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 288)} Size={UDim2.fromOffset(560, 44)}>
          <uilistlayout
            FillDirection={Enum.FillDirection.Horizontal}
            Padding={new UDim(0, theme.space[8])}
            VerticalAlignment={Enum.VerticalAlignment.Center}
          />
          <Text
            BackgroundTransparency={1}
            LayoutOrder={1}
            Size={UDim2.fromOffset(280, 20)}
            Text="Project deleted."
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.bodyMd.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
              LayoutOrder: 2,
              Size: UDim2.fromOffset(120, 36),
              Text: "Restore",
              Event: {
                Activated: () => {
                  setDeleted(false);
                },
              },
            }) as Record<string, unknown>)}
          />
        </frame>
      ) : undefined}
    </frame>
  );
}
