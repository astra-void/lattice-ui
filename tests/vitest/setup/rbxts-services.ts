const gameServices = globalThis.game as
  | {
      GetService?: (serviceName: string) => unknown;
    }
  | undefined;

function getService<T>(serviceName: string): T {
  if (!gameServices?.GetService) {
    throw new Error(`Missing test DataModel service shim for ${serviceName}`);
  }

  return gameServices.GetService(serviceName) as T;
}

export const RunService = getService<{
  Heartbeat?: { Connect: (callback: (dt: number) => void) => RBXScriptConnection };
  RenderStepped?: { Connect: (callback: (dt: number) => void) => RBXScriptConnection };
}>("RunService");

export const Workspace = getService<{
  CurrentCamera?: unknown;
  GetPropertyChangedSignal?: (propertyName: string) => RBXScriptSignal;
}>("Workspace");
