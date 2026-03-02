const WorkspaceService = game.GetService("Workspace");

export type ObserverUnsubscribe = () => void;

function subscribeGuiObjectLayout(guiObject: GuiObject, onChange: () => void): ObserverUnsubscribe {
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

export function subscribeAnchor(anchor: GuiObject, onChange: () => void): ObserverUnsubscribe {
  return subscribeGuiObjectLayout(anchor, onChange);
}

export function subscribeContent(content: GuiObject, onChange: () => void): ObserverUnsubscribe {
  return subscribeGuiObjectLayout(content, onChange);
}

export function subscribeViewport(onChange: () => void): ObserverUnsubscribe {
  let viewportConnection: RBXScriptConnection | undefined;

  const reconnectViewportConnection = () => {
    if (viewportConnection) {
      viewportConnection.Disconnect();
      viewportConnection = undefined;
    }

    const currentCamera = WorkspaceService.CurrentCamera;
    if (currentCamera) {
      viewportConnection = currentCamera.GetPropertyChangedSignal("ViewportSize").Connect(() => {
        onChange();
      });
    }
  };

  reconnectViewportConnection();
  const cameraConnection = WorkspaceService.GetPropertyChangedSignal("CurrentCamera").Connect(() => {
    reconnectViewportConnection();
    onChange();
  });

  return () => {
    if (viewportConnection) {
      viewportConnection.Disconnect();
      viewportConnection = undefined;
    }
    cameraConnection.Disconnect();
  };
}
