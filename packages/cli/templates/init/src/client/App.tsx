import { Text } from "@lattice-ui/style";
import React from "@rbxts/react";
import { LATTICE_INIT_MESSAGE } from "../shared/constants";

export function App() {
  return (
    <screengui IgnoreGuiInset ResetOnSpawn={false}>
      <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
        <Text
          AnchorPoint={new Vector2(0.5, 0.5)}
          Position={UDim2.fromScale(0.5, 0.5)}
          Size={UDim2.fromOffset(420, 40)}
          Text={LATTICE_INIT_MESSAGE}
          TextSize={24}
          TextXAlignment={Enum.TextXAlignment.Center}
          TextYAlignment={Enum.TextYAlignment.Center}
        />
      </frame>
    </screengui>
  );
}
