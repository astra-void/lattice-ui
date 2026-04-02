import { React } from "@lattice-ui/core";
import { Presence } from "@lattice-ui/layer";

type ExitCardProps = {
  isPresent: boolean;
  onExitComplete: () => void;
};

function ExitAnimatedCard(props: ExitCardProps) {
  React.useEffect(() => {
    if (props.isPresent) {
      return;
    }

    const delayThread = task.delay(0.35, () => {
      props.onExitComplete();
    });

    return () => {
      if (delayThread !== coroutine.running()) {
        task.cancel(delayThread);
      }
    };
  }, [props.isPresent, props.onExitComplete]);

  return (
    <frame
      BackgroundColor3={Color3.fromRGB(31, 46, 71)}
      BackgroundTransparency={props.isPresent ? 0 : 0.55}
      BorderSizePixel={0}
      Position={UDim2.fromOffset(0, 122)}
      Size={UDim2.fromOffset(420, 190)}
    >
      <uicorner CornerRadius={new UDim(0, 8)} />
      <uipadding PaddingLeft={new UDim(0, 16)} PaddingRight={new UDim(0, 16)} PaddingTop={new UDim(0, 14)} />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(320, 30)}
        Text={props.isPresent ? "Present: mounted" : "Present: exiting..."}
        TextColor3={Color3.fromRGB(226, 234, 245)}
        TextSize={22}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 38)}
        Size={UDim2.fromOffset(360, 58)}
        Text="When set to false, this card stays mounted briefly, then unmounts via onExitComplete."
        TextColor3={Color3.fromRGB(183, 194, 208)}
        TextSize={16}
        TextWrapped={true}
        TextXAlignment={Enum.TextXAlignment.Left}
        TextYAlignment={Enum.TextYAlignment.Top}
      />
    </frame>
  );
}

export function PresenceScene() {
  const [present, setPresent] = React.useState(true);
  const [unmountCount, setUnmountCount] = React.useState(0);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(760, 28)}
        Text="Presence keeps node mounted while exiting."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={present ? Color3.fromRGB(176, 78, 64) : Color3.fromRGB(35, 127, 80)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 52)}
        Size={UDim2.fromOffset(220, 44)}
        Text={present ? "Set present=false" : "Set present=true"}
        TextColor3={Color3.fromRGB(243, 245, 249)}
        TextSize={16}
        Event={{
          Activated: () => {
            setPresent((value) => !value);
          },
        }}
      />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(236, 61)}
        Size={UDim2.fromOffset(300, 24)}
        Text={`Unmount complete count: ${unmountCount}`}
        TextColor3={Color3.fromRGB(177, 186, 199)}
        TextSize={16}
        TextXAlignment={Enum.TextXAlignment.Left}
      />

      <Presence
        exitFallbackMs={1000}
        onExitComplete={() => {
          setUnmountCount((value) => value + 1);
        }}
        present={present}
        render={(state) => <ExitAnimatedCard isPresent={state.isPresent} onExitComplete={state.onExitComplete} />}
      />
    </frame>
  );
}
