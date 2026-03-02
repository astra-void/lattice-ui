export function observeGuiObjectLayout(guiObject: GuiObject, onChange: () => void) {
  const positionConnection = guiObject.GetPropertyChangedSignal("AbsolutePosition").Connect(() => {
    onChange();
  });
  const sizeConnection = guiObject.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
    onChange();
  });

  return () => {
    positionConnection.Disconnect();
    sizeConnection.Disconnect();
  };
}
