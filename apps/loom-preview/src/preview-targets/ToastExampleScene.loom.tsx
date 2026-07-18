import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Toast, useToast } from "@lattice-ui/toast";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

function ToastExampleContent() {
  const { theme } = useTheme();
  const toast = useToast();

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <textbutton
        {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "md" }, theme), {
          AnchorPoint: new Vector2(0.5, 0),
          Event: {
            Activated: () => {
              toast.enqueue({
                title: "Event created",
                description: "Friday, July 18 at 5:57 PM",
              });
            },
          },
          Position: UDim2.fromScale(0.5, 0),
          Size: UDim2.fromOffset(140, 40),
          Text: "Show toast",
        }) as Record<string, unknown>)}
      />

      <Toast.Viewport asChild>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 56)} Size={UDim2.fromOffset(340, 196)}>
          <uilistlayout
            FillDirection={Enum.FillDirection.Vertical}
            Padding={new UDim(0, theme.space[8])}
            SortOrder={Enum.SortOrder.LayoutOrder}
          />
          {toast.visibleToasts.map((record) => (
            <Toast.Root
              asChild
              key={record.id}
              onExitComplete={() => toast.finalize(record.id)}
              visible={!record.exiting}
            >
              <canvasgroup
                BackgroundColor3={theme.colors.surfaceElevated}
                BorderSizePixel={0}
                Size={UDim2.fromOffset(340, 58)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                <uistroke Color={theme.colors.border} Thickness={1} />
                <uipadding
                  PaddingLeft={new UDim(0, theme.space[12])}
                  PaddingRight={new UDim(0, theme.space[12])}
                  PaddingTop={new UDim(0, theme.space[10])}
                />
                <Toast.Title asChild>
                  <Text
                    BackgroundTransparency={1}
                    Size={UDim2.fromOffset(280, 18)}
                    Text={record.title ?? ""}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Toast.Title>
                <Toast.Description asChild>
                  <Text
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(0, 22)}
                    Size={UDim2.fromOffset(280, 16)}
                    Text={record.description ?? ""}
                    TextColor3={theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Toast.Description>
                <Toast.Close asChild onClose={() => toast.remove(record.id)}>
                  <textbutton
                    AutoButtonColor={false}
                    BackgroundTransparency={1}
                    BorderSizePixel={0}
                    Position={UDim2.fromOffset(292, 0)}
                    Size={UDim2.fromOffset(24, 18)}
                    Text="X"
                    TextColor3={theme.colors.textSecondary}
                    TextSize={12}
                  />
                </Toast.Close>
              </canvasgroup>
            </Toast.Root>
          ))}
        </frame>
      </Toast.Viewport>
    </frame>
  );
}

function ToastExample() {
  return (
    <Toast.Provider defaultDurationMs={5000} maxVisible={3}>
      <ToastExampleContent />
    </Toast.Provider>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={260} width={340}>
      <ToastExample />
    </DocExampleShell>
  ),
  title: "Toast Example",
} as const;
