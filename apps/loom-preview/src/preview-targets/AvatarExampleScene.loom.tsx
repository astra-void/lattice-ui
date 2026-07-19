import { Avatar } from "@lattice-ui/react-avatar";
import { React } from "@lattice-ui/react-runtime";
import { Text, useTheme } from "@lattice-ui/react-style";
import { DocExampleShell } from "./DocExampleShell";

type Member = {
  initials: string;
  name: string;
  role: string;
  accent?: boolean;
};

function AvatarExample() {
  const { theme } = useTheme();

  const members: Array<Member> = [
    { initials: "AC", name: "Ava Chen", role: "Design lead", accent: true },
    { initials: "NP", name: "Noah Park", role: "Engineer" },
    { initials: "MT", name: "Mia Torres", role: "Product" },
  ];

  return (
    <frame BackgroundColor3={theme.colors.surfaceElevated} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
      <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
      <uistroke Color={theme.colors.border} Thickness={1} />
      <uipadding
        PaddingBottom={new UDim(0, theme.space[16])}
        PaddingLeft={new UDim(0, theme.space[20])}
        PaddingRight={new UDim(0, theme.space[20])}
        PaddingTop={new UDim(0, theme.space[16])}
      />
      <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

      <frame BackgroundTransparency={1} LayoutOrder={0} Size={UDim2.fromOffset(260, 40)}>
        <Text
          BackgroundTransparency={1}
          Font={Enum.Font.GothamBold}
          Size={UDim2.fromOffset(260, 18)}
          Text="Project members"
          TextColor3={theme.colors.textPrimary}
          TextSize={theme.typography.bodyMd.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
        <Text
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(0, 22)}
          Size={UDim2.fromOffset(260, 16)}
          Text="3 people · 2 online"
          TextColor3={theme.colors.textSecondary}
          TextSize={theme.typography.labelSm.textSize}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>

      {members.map((member, index) => (
        <frame
          BackgroundTransparency={1}
          key={member.initials}
          LayoutOrder={index + 1}
          Size={UDim2.fromOffset(260, 40)}
        >
          <Avatar.Root>
            <frame
              BackgroundColor3={member.accent ? theme.colors.accent : theme.colors.surface}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(0, 2)}
              Size={UDim2.fromOffset(36, 36)}
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <uistroke Color={member.accent ? theme.colors.accent : theme.colors.border} Thickness={1} />
              <Avatar.Fallback asChild>
                <textlabel
                  BackgroundTransparency={1}
                  BorderSizePixel={0}
                  Font={Enum.Font.GothamMedium}
                  Size={UDim2.fromScale(1, 1)}
                  Text={member.initials}
                  TextColor3={member.accent ? theme.colors.accentContrast : theme.colors.textPrimary}
                  TextSize={theme.typography.labelSm.textSize}
                />
              </Avatar.Fallback>
            </frame>
          </Avatar.Root>
          <Text
            BackgroundTransparency={1}
            Font={Enum.Font.GothamMedium}
            Position={UDim2.fromOffset(48, 2)}
            Size={UDim2.fromOffset(212, 18)}
            Text={member.name}
            TextColor3={theme.colors.textPrimary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
          <Text
            BackgroundTransparency={1}
            Position={UDim2.fromOffset(48, 22)}
            Size={UDim2.fromOffset(212, 16)}
            Text={member.role}
            TextColor3={theme.colors.textSecondary}
            TextSize={theme.typography.labelSm.textSize}
            TextXAlignment={Enum.TextXAlignment.Left}
          />
        </frame>
      ))}
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={222} width={300}>
      <AvatarExample />
    </DocExampleShell>
  ),
  title: "Avatar Example",
} as const;
