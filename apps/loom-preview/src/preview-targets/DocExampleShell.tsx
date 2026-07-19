import { PortalProvider } from "@lattice-ui/react-layer";
import { React } from "@lattice-ui/react-runtime";
import { defaultDarkTheme, defaultLightTheme } from "@lattice-ui/react-style";
import { SystemProvider } from "@lattice-ui/react-system";

type DocExampleShellProps = {
  /** Fixed pixel size of the centered example stage. */
  width: number;
  height: number;
  children: React.ReactNode;
};

/** The docs preview's portal container. Also used by the playground scene. */
export function getDocPortalContainer() {
  const players = game.GetService("Players");
  const localPlayer = players.LocalPlayer;

  if (!localPlayer) {
    error("LocalPlayer is required for the doc example shell.");
  }

  const playerGui = localPlayer.WaitForChild("PlayerGui");
  if (!playerGui.IsA("PlayerGui")) {
    error("PlayerGui is required for the doc example shell.");
  }

  return playerGui;
}

/**
 * The docs site mirrors its light/dark toggle onto `PlayerGui.LoomTheme`
 * (a loom-preview extension property). Read it and follow changes so embedded
 * examples always match the host page's theme; defaults to dark outside the
 * docs (plain gallery browsing).
 */
export function useDocTheme(playerGui: PlayerGui) {
  const readThemeName = React.useCallback(() => {
    const value = (playerGui as unknown as { LoomTheme?: unknown }).LoomTheme;
    return value === "light" ? "light" : "dark";
  }, [playerGui]);

  const [themeName, setThemeName] = React.useState<"light" | "dark">(readThemeName);

  React.useEffect(() => {
    // `LoomTheme` is a loom extension property, so widen the signal accessor.
    const gui = playerGui as unknown as {
      GetPropertyChangedSignal(property: string): RBXScriptSignal;
    };
    const connection = gui.GetPropertyChangedSignal("LoomTheme").Connect(() => {
      setThemeName(readThemeName());
    });
    setThemeName(readThemeName());
    return () => connection.Disconnect();
  }, [playerGui, readThemeName]);

  return themeName === "light" ? defaultLightTheme : defaultDarkTheme;
}

/**
 * Shell for docs-embedded examples: theme/portal providers plus a fixed-size
 * stage centered in the viewport, so an example reads like a real usage
 * snippet instead of a full-bleed test scene. The stage background follows
 * the host docs theme (see {@link useDocTheme}).
 */
export function DocExampleShell(props: DocExampleShellProps) {
  const playerGui = getDocPortalContainer();
  const theme = useDocTheme(playerGui);

  return (
    <PortalProvider container={playerGui}>
      <SystemProvider defaultDensity="comfortable" theme={theme}>
        <frame BackgroundColor3={theme.colors.background} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
          <frame
            AnchorPoint={new Vector2(0.5, 0.5)}
            BackgroundTransparency={1}
            Position={UDim2.fromScale(0.5, 0.5)}
            Size={UDim2.fromOffset(props.width, props.height)}
          >
            {props.children}
          </frame>
        </frame>
      </SystemProvider>
    </PortalProvider>
  );
}
