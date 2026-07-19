import { React } from "@lattice-ui/core";
import type { Theme } from "@lattice-ui/style";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Toast } from "@lattice-ui/toast";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type ToastCardProps = {
  theme: Theme;
  layoutOrder: number;
  accent: Color3;
  title: string;
  description?: string;
  actionLabel?: string;
};

function ToastCard(props: ToastCardProps) {
  const { theme } = props;
  const hasDescription = props.description !== undefined;

  return (
    <Toast.Root asChild>
      <frame
        BackgroundColor3={theme.colors.surfaceElevated}
        BorderSizePixel={0}
        LayoutOrder={props.layoutOrder}
        Size={UDim2.fromOffset(400, hasDescription ? 74 : 52)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
        <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.55} />

        {/* Tone accent stripe */}
        <frame
          BackgroundColor3={props.accent}
          BorderSizePixel={0}
          Position={UDim2.fromOffset(0, 0)}
          Size={new UDim2(0, 4, 1, 0)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
        </frame>

        <uipadding
          PaddingBottom={new UDim(0, theme.space[8])}
          PaddingLeft={new UDim(0, theme.space[16])}
          PaddingRight={new UDim(0, theme.space[10])}
          PaddingTop={new UDim(0, theme.space[8])}
        />

        <Toast.Title asChild>
          <Text
            BackgroundTransparency={1}
            Size={UDim2.fromOffset(300, 20)}
            Text={props.title}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </Toast.Title>

        {hasDescription ? (
          <Toast.Description asChild>
            <Text
              BackgroundTransparency={1}
              Position={UDim2.fromOffset(0, 24)}
              Size={UDim2.fromOffset(300, 18)}
              Text={props.description ?? ""}
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.bodyMd.textSize}
              TextXAlignment={Enum.TextXAlignment.Left}
            />
          </Toast.Description>
        ) : undefined}

        {props.actionLabel !== undefined ? (
          <Toast.Action asChild>
            <textbutton
              {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                Position: UDim2.fromOffset(250, 20),
                Size: UDim2.fromOffset(108, 34),
                Text: props.actionLabel,
              }) as Record<string, unknown>)}
            />
          </Toast.Action>
        ) : undefined}

        <Toast.Close asChild>
          <textbutton
            AutoButtonColor={false}
            BackgroundTransparency={1}
            BorderSizePixel={0}
            Position={UDim2.fromOffset(360, 0)}
            Size={UDim2.fromOffset(24, 20)}
            Text="X"
            TextColor3={theme.colors.textSecondary}
            TextSize={12}
          />
        </Toast.Close>
      </frame>
    </Toast.Root>
  );
}

function SectionHeader(props: { theme: Theme; text: string; layoutOrder: number }) {
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.layoutOrder}
      Size={UDim2.fromOffset(400, 20)}
      Text={props.text}
      TextColor3={props.theme.colors.textSecondary}
      TextSize={props.theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

export function ToastBasicScene() {
  const { theme } = useTheme();

  const successColor = Color3.fromRGB(46, 160, 96);
  const warningColor = Color3.fromRGB(202, 138, 4);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 620)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Toast: declarative composition preview"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <frame
        {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
          Position: UDim2.fromOffset(0, 48),
          Size: UDim2.fromOffset(460, 560),
        }) as Record<string, unknown>)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
        <uistroke Color={theme.colors.border} Thickness={1} Transparency={0.6} />
        <uipadding
          PaddingBottom={new UDim(0, theme.space[16])}
          PaddingLeft={new UDim(0, theme.space[16])}
          PaddingRight={new UDim(0, theme.space[16])}
          PaddingTop={new UDim(0, theme.space[16])}
        />
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[8])} />

        <SectionHeader layoutOrder={1} text="Tones" theme={theme} />
        <ToastCard
          accent={successColor}
          description="Your preferences were updated."
          layoutOrder={2}
          theme={theme}
          title="Saved"
        />
        <ToastCard
          accent={warningColor}
          description="Actions are queued and will retry."
          layoutOrder={3}
          theme={theme}
          title="Network unstable"
        />
        <ToastCard
          accent={theme.colors.danger}
          description="The upload failed after 3 attempts."
          layoutOrder={4}
          theme={theme}
          title="Upload error"
        />
        <ToastCard
          accent={theme.colors.accent}
          description="A new version is available."
          layoutOrder={5}
          theme={theme}
          title="Update ready"
        />

        <SectionHeader layoutOrder={6} text="Composition" theme={theme} />
        <ToastCard
          accent={theme.colors.accent}
          actionLabel="Undo"
          description="The item was moved to the trash."
          layoutOrder={7}
          theme={theme}
          title="Item deleted"
        />
        <ToastCard accent={successColor} layoutOrder={8} theme={theme} title="Copied to clipboard" />
      </frame>
    </frame>
  );
}
