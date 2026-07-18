import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";
import { Tabs } from "@lattice-ui/tabs";
import { buttonRecipe, panelRecipe } from "../../../playground/src/client/theme/recipes";
import { DocExampleShell } from "./DocExampleShell";

type AccountTabKey = "account" | "password";

type FieldSpec = {
  label: string;
  value: string;
};

function ExampleField(props: { field: FieldSpec; offsetY: number; theme: ReturnType<typeof useTheme>["theme"] }) {
  const { field, offsetY, theme } = props;

  return (
    <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, offsetY)} Size={UDim2.fromOffset(276, 48)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(276, 14)}
        Text={field.label}
        TextColor3={theme.colors.textSecondary}
        TextSize={theme.typography.labelSm.textSize}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <frame
        BackgroundColor3={theme.colors.surfaceElevated}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 18)}
        Size={UDim2.fromOffset(276, 30)}
      >
        <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
        <uistroke Color={theme.colors.border} Thickness={1} />
        <uipadding PaddingLeft={new UDim(0, theme.space[10])} />
        <Text
          BackgroundTransparency={1}
          Size={UDim2.fromScale(1, 1)}
          Text={field.value}
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>
    </frame>
  );
}

function TabsExample() {
  const { theme } = useTheme();
  const [tab, setTab] = React.useState<AccountTabKey>("account");

  const panels: Array<{ value: AccountTabKey; heading: string; fields: Array<FieldSpec> }> = [
    {
      value: "account",
      heading: "Account",
      fields: [
        { label: "Name", value: "Jane Doe" },
        { label: "Username", value: "@jane" },
      ],
    },
    {
      value: "password",
      heading: "Password",
      fields: [
        { label: "Current password", value: "••••••••" },
        { label: "New password", value: "••••••••" },
      ],
    },
  ];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <Tabs.Root onValueChange={(nextValue) => setTab(nextValue as AccountTabKey)} value={tab}>
        <Tabs.List asChild>
          <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 0)} Size={UDim2.fromOffset(300, 32)}>
            <uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, theme.space[6])} />

            <Tabs.Trigger asChild value="account">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: tab === "account" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(100, 32),
                    Text: "Account",
                  },
                ) as Record<string, unknown>)}
              />
            </Tabs.Trigger>

            <Tabs.Trigger asChild value="password">
              <textbutton
                {...(mergeGuiProps(
                  buttonRecipe({ intent: tab === "password" ? "primary" : "surface", size: "sm" }, theme),
                  {
                    Size: UDim2.fromOffset(100, 32),
                    Text: "Password",
                  },
                ) as Record<string, unknown>)}
              />
            </Tabs.Trigger>
          </frame>
        </Tabs.List>

        {panels.map((panel) => (
          <Tabs.Content asChild key={panel.value} value={panel.value}>
            <frame
              {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
                Position: UDim2.fromOffset(0, 44),
                Size: UDim2.fromOffset(300, 160),
              }) as Record<string, unknown>)}
            >
              <uicorner CornerRadius={new UDim(0, theme.radius.md)} />
              <uipadding
                PaddingBottom={new UDim(0, theme.space[12])}
                PaddingLeft={new UDim(0, theme.space[12])}
                PaddingRight={new UDim(0, theme.space[12])}
                PaddingTop={new UDim(0, theme.space[12])}
              />
              <Text
                BackgroundTransparency={1}
                Size={UDim2.fromOffset(276, 20)}
                Text={panel.heading}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.bodyMd.textSize}
                TextXAlignment={Enum.TextXAlignment.Left}
              />
              {panel.fields.map((field, index) => (
                <ExampleField field={field} key={field.label} offsetY={28 + index * 56} theme={theme} />
              ))}
            </frame>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={210} width={300}>
      <TabsExample />
    </DocExampleShell>
  ),
  title: "Tabs Example",
} as const;
