import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tabs } from "@lattice-ui/tabs";
import { buttonRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

type AccountTabKey = "account" | "password";

type FieldSpec = {
  label: string;
  value: string;
};

function ExampleField(props: { field: FieldSpec; layoutOrder: number }) {
  const { theme } = useTheme();
  const { field, layoutOrder } = props;

  return (
    <frame BackgroundTransparency={1} LayoutOrder={layoutOrder} Size={UDim2.fromOffset(280, 60)}>
      <Text
        BackgroundTransparency={1}
        Font={Enum.Font.GothamMedium}
        Size={UDim2.fromOffset(280, 16)}
        Text={field.label}
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <frame
        BackgroundColor3={theme.colors.surface}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 22)}
        Size={UDim2.fromOffset(280, 38)}
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
        />
      </frame>
    </frame>
  );
}

function TabsExample() {
  const { theme } = useTheme();
  const [tab, setTab] = React.useState<AccountTabKey>("account");

  const panels: Array<{ value: AccountTabKey; action: string; fields: Array<FieldSpec> }> = [
    {
      value: "account",
      action: "Save changes",
      fields: [
        { label: "Name", value: "Jane Doe" },
        { label: "Username", value: "@jane" },
      ],
    },
    {
      value: "password",
      action: "Update password",
      fields: [
        { label: "Current password", value: "••••••••" },
        { label: "New password", value: "••••••••" },
      ],
    },
  ];

  const tabs: Array<{ value: AccountTabKey; label: string }> = [
    { value: "account", label: "Account" },
    { value: "password", label: "Password" },
  ];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Tabs.Root onValueChange={(nextValue) => setTab(nextValue as AccountTabKey)} value={tab}>
        <Tabs.List asChild>
          <frame BackgroundColor3={theme.colors.surface} BorderSizePixel={0} Size={UDim2.fromOffset(320, 40)}>
            <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <uipadding
              PaddingBottom={new UDim(0, theme.space[4])}
              PaddingLeft={new UDim(0, theme.space[4])}
              PaddingRight={new UDim(0, theme.space[4])}
              PaddingTop={new UDim(0, theme.space[4])}
            />
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[4])} />

            {tabs.map((entry, index) => {
              const selected = tab === entry.value;
              return (
                <Tabs.Trigger asChild key={entry.value} value={entry.value}>
                  <textbutton
                    AutoButtonColor={false}
                    BackgroundColor3={theme.colors.surfaceElevated}
                    BackgroundTransparency={selected ? 0 : 1}
                    BorderSizePixel={0}
                    Font={selected ? Enum.Font.GothamMedium : Enum.Font.Gotham}
                    LayoutOrder={index}
                    Size={UDim2.fromOffset(154, 32)}
                    Text={entry.label}
                    TextColor3={selected ? theme.colors.textPrimary : theme.colors.textSecondary}
                    TextSize={theme.typography.labelSm.textSize}
                  >
                    <uicorner CornerRadius={new UDim(0, theme.radius.sm)} />
                    {selected ? <uistroke Color={theme.colors.border} Thickness={1} /> : undefined}
                  </textbutton>
                </Tabs.Trigger>
              );
            })}
          </frame>
        </Tabs.List>

        {panels.map((panel) => (
          <Tabs.Content asChild key={panel.value} value={panel.value}>
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 52)}
              Size={UDim2.fromOffset(320, 224)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
              <uistroke Color={theme.colors.border} Thickness={1} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[20])}
                PaddingLeft={new UDim(0, theme.space[20])}
                PaddingRight={new UDim(0, theme.space[20])}
                PaddingTop={new UDim(0, theme.space[20])}
              />
              <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[12])} />

              {panel.fields.map((field, index) => (
                <ExampleField field={field} key={field.label} layoutOrder={index} />
              ))}

              <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(280, 40)}>
                <textbutton
                  {...(mergeGuiProps(buttonRecipe({ intent: "primary", size: "sm" }, theme), {
                    AnchorPoint: new Vector2(1, 1),
                    Position: UDim2.fromScale(1, 1),
                    Size: UDim2.fromOffset(150, 36),
                    Text: panel.action,
                    TextSize: theme.typography.labelSm.textSize,
                  }) as Record<string, unknown>)}
                >
                  <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
                </textbutton>
              </frame>
            </frame>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={276} width={320}>
      <TabsExample />
    </DocExampleShell>
  ),
  title: "Tabs Example",
} as const;
