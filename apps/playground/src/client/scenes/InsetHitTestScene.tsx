import { React } from "@lattice-ui/core";

const Players = game.GetService("Players");
const GuiService = game.GetService("GuiService");
const UserInputService = game.GetService("UserInputService");

function isPointerInput(inputObject: InputObject) {
  return (
    inputObject.UserInputType === Enum.UserInputType.MouseButton1 ||
    inputObject.UserInputType === Enum.UserInputType.Touch
  );
}

function getNormalizedPointerSamples(pointerPosition: Vector2, ignoreGuiInset: boolean) {
  const [insetTopLeft] = GuiService.GetGuiInset();

  const samples: Vector2[] = [];
  const sampleKeys: Record<string, true> = {};

  const addSample = (x: number, y: number) => {
    const roundedX = math.round(x);
    const roundedY = math.round(y);
    const key = `${roundedX}:${roundedY}`;
    if (sampleKeys[key]) {
      return;
    }
    sampleKeys[key] = true;
    samples.push(new Vector2(roundedX, roundedY));
  };

  addSample(pointerPosition.X, pointerPosition.Y);
  addSample(pointerPosition.X + insetTopLeft.X, pointerPosition.Y + insetTopLeft.Y);
  addSample(pointerPosition.X - insetTopLeft.X, pointerPosition.Y - insetTopLeft.Y);

  if (ignoreGuiInset) {
    addSample(pointerPosition.X, pointerPosition.Y + insetTopLeft.Y);
    addSample(pointerPosition.X, pointerPosition.Y - insetTopLeft.Y);
    addSample(pointerPosition.X + insetTopLeft.X, pointerPosition.Y);
    addSample(pointerPosition.X - insetTopLeft.X, pointerPosition.Y);
  }

  return samples;
}

export function InsetHitTestScene() {
  const [ignoreGuiInset, setIgnoreGuiInset] = React.useState(true);
  const [lastResult, setLastResult] = React.useState("Click screen to inspect outside hit-test samples.");
  const targetRef = React.useRef<Frame>();

  React.useEffect(() => {
    const localPlayer = Players.LocalPlayer;
    if (!localPlayer) {
      return;
    }

    const playerGuiInstance = localPlayer.FindFirstChild("PlayerGui");
    if (!playerGuiInstance?.IsA("PlayerGui")) {
      return;
    }
    const playerGui = playerGuiInstance;

    const connection = UserInputService.InputBegan.Connect((inputObject, gameProcessedEvent) => {
      if (gameProcessedEvent || !isPointerInput(inputObject)) {
        return;
      }

      const targetFrame = targetRef.current;
      if (!targetFrame) {
        return;
      }

      const pointer = new Vector2(inputObject.Position.X, inputObject.Position.Y);
      const samples = getNormalizedPointerSamples(pointer, ignoreGuiInset);

      let isInside = false;
      for (const sample of samples) {
        const hits = playerGui.GetGuiObjectsAtPosition(sample.X, sample.Y);
        for (const hitObject of hits) {
          if (hitObject.IsDescendantOf(targetFrame)) {
            isInside = true;
            break;
          }
        }
        if (isInside) {
          break;
        }
      }

      setLastResult(
        `${isInside ? "Inside" : "Outside"} | raw=(${math.round(pointer.X)}, ${math.round(pointer.Y)}) | samples=${samples.size()}`,
      );
    });

    return () => {
      connection.Disconnect();
    };
  }, [ignoreGuiInset]);

  return (
    <frame BackgroundTransparency={1} Size={UDim2.fromOffset(920, 520)}>
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(860, 28)}
        Text="Inset Hit-Test: toggle IgnoreGuiInset and click around top bar/panel edges."
        TextColor3={Color3.fromRGB(223, 229, 237)}
        TextSize={20}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <textbutton
        AutoButtonColor={false}
        BackgroundColor3={ignoreGuiInset ? Color3.fromRGB(35, 127, 80) : Color3.fromRGB(156, 84, 48)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 50)}
        Size={UDim2.fromOffset(250, 40)}
        Text={`IgnoreGuiInset: ${ignoreGuiInset ? "true" : "false"}`}
        TextColor3={Color3.fromRGB(238, 242, 249)}
        TextSize={16}
        Event={{
          Activated: () => {
            setIgnoreGuiInset((value) => !value);
          },
        }}
      />
      <textlabel
        BackgroundTransparency={1}
        Position={UDim2.fromOffset(0, 98)}
        Size={UDim2.fromOffset(860, 26)}
        Text={lastResult}
        TextColor3={Color3.fromRGB(188, 198, 212)}
        TextSize={16}
        TextXAlignment={Enum.TextXAlignment.Left}
      />
      <frame
        BackgroundColor3={Color3.fromRGB(57, 38, 77)}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(420, ignoreGuiInset ? 52 : 86)}
        Size={UDim2.fromOffset(320, 180)}
        ref={targetRef}
      >
        <uicorner CornerRadius={new UDim(0, 8)} />
        <textlabel
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(16, 16)}
          Size={UDim2.fromOffset(280, 54)}
          Text="Target content area for hit-test. Click inside and outside."
          TextColor3={Color3.fromRGB(228, 219, 242)}
          TextSize={16}
          TextWrapped={true}
          TextXAlignment={Enum.TextXAlignment.Left}
          TextYAlignment={Enum.TextYAlignment.Top}
        />
      </frame>
      <frame
        BackgroundColor3={Color3.fromRGB(120, 46, 46)}
        BackgroundTransparency={0.35}
        BorderSizePixel={0}
        Position={UDim2.fromOffset(0, 0)}
        Size={UDim2.fromOffset(920, 36)}
      >
        <textlabel
          BackgroundTransparency={1}
          Position={UDim2.fromOffset(10, 8)}
          Size={UDim2.fromOffset(760, 20)}
          Text="Topbar-like region (inset reference)"
          TextColor3={Color3.fromRGB(245, 224, 224)}
          TextSize={14}
          TextXAlignment={Enum.TextXAlignment.Left}
        />
      </frame>
    </frame>
  );
}
