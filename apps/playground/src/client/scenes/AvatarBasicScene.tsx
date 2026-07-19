import { Avatar } from "@lattice-ui/avatar";
import { React } from "@lattice-ui/core";
import { mergeGuiProps, Text, useTheme } from "@lattice-ui/style";

import { buttonRecipe, panelRecipe } from "../theme/recipes";

type Theme = ReturnType<typeof useTheme>["theme"];

const VALID_IMAGE = "rbxasset://textures/ui/GuiImagePlaceholder.png";
const BROKEN_IMAGE = "rbxassetid://0";

type StatusTone = "online" | "busy" | "offline";

function statusColor(theme: Theme, status: StatusTone) {
  if (status === "online") {
    return theme.colors.accent;
  }
  if (status === "busy") {
    return theme.colors.danger;
  }
  return theme.colors.textSecondary;
}

function SectionHeader(props: { theme: Theme; text: string; order: number }) {
  return (
    <Text
      BackgroundTransparency={1}
      LayoutOrder={props.order}
      Size={UDim2.fromOffset(860, 18)}
      Text={props.text}
      TextColor3={props.theme.colors.textSecondary}
      TextSize={props.theme.typography.labelSm.textSize}
      TextXAlignment={Enum.TextXAlignment.Left}
    />
  );
}

function AvatarBadge(props: {
  theme: Theme;
  size: number;
  initials: string;
  src?: string;
  status?: StatusTone;
  ringColor?: Color3;
  position?: UDim2;
  layoutOrder?: number;
  delayMs?: number;
}) {
  const { theme } = props;
  const dot = math.max(8, math.floor(props.size * 0.28));

  return (
    <Avatar.Root delayMs={props.delayMs ?? 250} src={props.src}>
      <frame
        BackgroundColor3={theme.colors.surfaceElevated}
        BorderSizePixel={0}
        LayoutOrder={props.layoutOrder}
        Position={props.position}
        Size={UDim2.fromOffset(props.size, props.size)}
      >
        <uicorner CornerRadius={new UDim(1, 0)} />
        {props.ringColor !== undefined ? <uistroke Color={props.ringColor} Thickness={2} /> : undefined}
        <Avatar.Image asChild>
          <imagelabel BackgroundTransparency={1} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
            <uicorner CornerRadius={new UDim(1, 0)} />
          </imagelabel>
        </Avatar.Image>
        <Avatar.Fallback asChild>
          <textlabel
            BackgroundTransparency={1}
            BorderSizePixel={0}
            Size={UDim2.fromScale(1, 1)}
            Text={props.initials}
            TextColor3={theme.colors.textPrimary}
            TextSize={math.max(theme.typography.labelSm.textSize, math.floor(props.size * 0.38))}
          />
        </Avatar.Fallback>
        {props.status !== undefined ? (
          <frame
            AnchorPoint={new Vector2(1, 1)}
            BackgroundColor3={statusColor(theme, props.status)}
            BorderSizePixel={0}
            Position={new UDim2(1, -1, 1, -1)}
            Size={UDim2.fromOffset(dot, dot)}
          >
            <uicorner CornerRadius={new UDim(1, 0)} />
            <uistroke Color={theme.colors.surface} Thickness={2} />
          </frame>
        ) : undefined}
      </frame>
    </Avatar.Root>
  );
}

const SIZES = [32, 44, 56, 72];
const STACK = [
  { initials: "AB", src: VALID_IMAGE },
  { initials: "CD", src: VALID_IMAGE },
  { initials: "EF", src: BROKEN_IMAGE },
  { initials: "GH", src: BROKEN_IMAGE },
];

export function AvatarBasicScene() {
  const { theme } = useTheme();
  const [useBrokenImage, setUseBrokenImage] = React.useState(false);

  const toggleSrc = useBrokenImage ? BROKEN_IMAGE : VALID_IMAGE;
  const stackSize = 44;
  const overlap = 16;

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(940, 640)}>
      <Text
        BackgroundTransparency={1}
        Size={UDim2.fromOffset(920, 28)}
        Text="Avatar: sizes, image + fallback initials + status dot, overlapping group, delayed fallback"
        TextColor3={theme.colors.textPrimary}
        TextSize={theme.typography.titleMd.textSize - 2}
        TextXAlignment={Enum.TextXAlignment.Left}
        truncate
      />

      <frame BackgroundTransparency={1} Position={UDim2.fromOffset(0, 44)} Size={UDim2.fromOffset(940, 580)}>
        <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[16])} />

        {/* Sizes */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 1,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="SIZES" order={1} />
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 80)}>
            <uilistlayout
              FillDirection={Enum.FillDirection.Horizontal}
              Padding={new UDim(0, theme.space[16])}
              VerticalAlignment={Enum.VerticalAlignment.Center}
            />
            {SIZES.map((size, index) => (
              <AvatarBadge
                key={`size-${size}`}
                theme={theme}
                size={size}
                initials="UI"
                src={VALID_IMAGE}
                layoutOrder={index}
              />
            ))}
          </frame>
        </frame>

        {/* Status */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 2,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="IMAGE, FALLBACK INITIALS & STATUS DOT" order={1} />
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 64)}>
            <uilistlayout
              FillDirection={Enum.FillDirection.Horizontal}
              Padding={new UDim(0, theme.space[16])}
              VerticalAlignment={Enum.VerticalAlignment.Center}
            />
            {/* Loaded image + online */}
            <AvatarBadge theme={theme} size={56} initials="JD" src={VALID_IMAGE} status="online" layoutOrder={1} />
            {/* Broken image -> fallback initials + busy */}
            <AvatarBadge theme={theme} size={56} initials="MK" src={BROKEN_IMAGE} status="busy" layoutOrder={2} />
            {/* No src -> fallback initials + offline */}
            <AvatarBadge theme={theme} size={56} initials="RS" status="offline" layoutOrder={3} />
          </frame>
        </frame>

        {/* Overlapping group */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 3,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader theme={theme} text="STACKED / OVERLAPPING GROUP" order={1} />
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 52)}>
            {STACK.map((member, index) => (
              <AvatarBadge
                key={`stack-${index}`}
                theme={theme}
                size={stackSize}
                initials={member.initials}
                src={member.src}
                ringColor={theme.colors.surface}
                position={UDim2.fromOffset(index * (stackSize - overlap), 0)}
              />
            ))}
            <frame
              BackgroundColor3={theme.colors.surfaceElevated}
              BorderSizePixel={0}
              Position={UDim2.fromOffset(STACK.size() * (stackSize - overlap), 0)}
              Size={UDim2.fromOffset(stackSize, stackSize)}
            >
              <uicorner CornerRadius={new UDim(1, 0)} />
              <uistroke Color={theme.colors.surface} Thickness={2} />
              <textlabel
                BackgroundTransparency={1}
                BorderSizePixel={0}
                Size={UDim2.fromScale(1, 1)}
                Text="+3"
                TextColor3={theme.colors.textSecondary}
                TextSize={theme.typography.labelSm.textSize}
              />
            </frame>
          </frame>
        </frame>

        {/* Delayed fallback toggle */}
        <frame
          {...(mergeGuiProps(panelRecipe({ tone: "surface" }, theme), {
            LayoutOrder: 4,
            AutomaticSize: Enum.AutomaticSize.Y,
            Size: UDim2.fromOffset(900, 0),
          }) as Record<string, unknown>)}
        >
          <uicorner CornerRadius={new UDim(0, theme.radius.lg)} />
          <uipadding
            PaddingBottom={new UDim(0, theme.space[12])}
            PaddingLeft={new UDim(0, theme.space[12])}
            PaddingRight={new UDim(0, theme.space[12])}
            PaddingTop={new UDim(0, theme.space[12])}
          />
          <uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, theme.space[10])} />

          <SectionHeader
            theme={theme}
            text={`DELAYED FALLBACK — src: ${useBrokenImage ? "broken" : "valid"}`}
            order={1}
          />
          <frame BackgroundTransparency={1} LayoutOrder={2} Size={UDim2.fromOffset(860, 56)}>
            <AvatarBadge theme={theme} size={56} initials="UI" src={toggleSrc} />
          </frame>
          <textbutton
            {...(mergeGuiProps(buttonRecipe({ intent: "surface", size: "sm" }, theme), {
              LayoutOrder: 3,
              Size: UDim2.fromOffset(220, 34),
              Text: useBrokenImage ? "Use valid image" : "Use broken image",
              Event: {
                Activated: () => {
                  setUseBrokenImage((value) => !value);
                },
              },
            }) as Record<string, unknown>)}
          />
        </frame>
      </frame>
    </frame>
  );
}
