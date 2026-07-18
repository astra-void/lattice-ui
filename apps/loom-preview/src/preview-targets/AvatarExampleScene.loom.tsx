import { Avatar } from "@lattice-ui/avatar";
import { React } from "@lattice-ui/core";
import { useTheme } from "@lattice-ui/style";
import { DocExampleShell } from "./DocExampleShell";

function AvatarExample() {
  const { theme } = useTheme();

  const users = ["AV", "CN", "+3"];

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
      <uilistlayout
        FillDirection={Enum.FillDirection.Horizontal}
        Padding={new UDim(0, theme.space[8])}
        VerticalAlignment={Enum.VerticalAlignment.Center}
      />
      {users.map((initials, index) => (
        <Avatar.Root key={initials}>
          <frame
            BackgroundColor3={theme.colors.surfaceElevated}
            BorderSizePixel={0}
            LayoutOrder={index}
            Size={UDim2.fromOffset(40, 40)}
          >
            <uicorner CornerRadius={new UDim(1, 0)} />
            <uistroke Color={theme.colors.border} Thickness={1} />
            <Avatar.Fallback asChild>
              <textlabel
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromScale(1, 1)}
                Text={initials}
                TextColor3={theme.colors.textPrimary}
                TextSize={theme.typography.labelSm.textSize}
              />
            </Avatar.Fallback>
          </frame>
        </Avatar.Root>
      ))}
    </frame>
  );
}

export const preview = {
  render: () => (
    <DocExampleShell height={40} width={136}>
      <AvatarExample />
    </DocExampleShell>
  ),
  title: "Avatar Example",
} as const;
