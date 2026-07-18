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
          TextSize: theme.typography.labelSm.textSize,
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
        <uistroke Color={theme.colors.border} Thickness={1} />
      </textbutton>

      <Toast.Viewport asChild>
        <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 56)} Size={UDim2.fromOffset(340, 220)}>
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
                Size={UDim2.fromOffset(340, 64)}
              >
                <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
                <uistroke Color={theme.colors.border} Thickness={1} />
                <frame
                  AnchorPoint={new Vector2(0, 0.5)}
                  BackgroundColor3={theme.colors.accent}
                  BorderSizePixel={0}
                  Position={new UDim2(0, 12, 0.5, 0)}
                  Size={UDim2.fromOffset(3, 36)}
                >
                  <uicorner CornerRadius={new UDim(1, 0)} />
                </frame>
                <Toast.Title asChild>
                  <Text
                    BackgroundTransparency={1}
                    Font={Enum.Font.GothamMedium}
                    Position={UDim2.fromOffset(28, 14)}
                    Size={UDim2.fromOffset(266, 18)}
                    Text={record.title ?? ""}
                    TextColor3={theme.colors.textPrimary}
                    TextSize={theme.typography.labelSm.textSize}
                    TextXAlignment={Enum.TextXAlignment.Left}
                  />
                </Toast.Title>
                <Toast.Description asChild>
                  <Text
                    BackgroundTransparency={1}
                    Position={UDim2.fromOffset(28, 35)}
                    Size={UDim2.fromOffset(266, 16)}
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
                    Position={UDim2.fromOffset(306, 14)}
                    Size={UDim2.fromOffset(18, 18)}
                    Text="✕"
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
    <DocExampleShell height={276} width={340}>
      <ToastExample />
    </DocExampleShell>
  ),
  title: "Toast Example",
} as const;
