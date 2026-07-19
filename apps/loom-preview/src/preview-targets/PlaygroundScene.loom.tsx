/**
 * The docs site's live playground target.
 *
 * Unlike every other scene here, this one renders code it is *given* rather
 * than code it ships: the docs page (`/playground`) compiles the editor's TSX
 * with sucrase into CommonJS and posts it in over `postMessage`. This scene
 * evaluates that module against a registry of the real `@lattice-ui/*` packages
 * — the same instances the static scenes import — so playground code behaves
 * exactly like a checked-in example.
 *
 * Protocol (parent → frame):
 *   { type: "loom-playground-run", code: <compiled CJS>, version: number }
 * Frame → parent:
 *   { type: "loom-playground-ready" }
 *   { type: "loom-playground-result", version, ok, message? }
 *
 * The compiled module may export either `preview` (`{ render() }`, the scene
 * convention used across this folder) or a default component.
 */
import * as Accordion from "@lattice-ui/react-accordion";
import * as Avatar from "@lattice-ui/react-avatar";
import * as Checkbox from "@lattice-ui/react-checkbox";
import * as Combobox from "@lattice-ui/react-combobox";
import * as Dialog from "@lattice-ui/react-dialog";
import * as Layer from "@lattice-ui/react-layer";
import { PortalProvider } from "@lattice-ui/react-layer";
import * as Popover from "@lattice-ui/react-popover";
import * as Progress from "@lattice-ui/react-progress";
import * as RadioGroup from "@lattice-ui/react-radio-group";
import * as Core from "@lattice-ui/react-runtime";
import { React } from "@lattice-ui/react-runtime";
import * as ScrollArea from "@lattice-ui/react-scroll-area";
import * as Select from "@lattice-ui/react-select";
import * as Slider from "@lattice-ui/react-slider";
import * as Style from "@lattice-ui/react-style";
import { Text } from "@lattice-ui/react-style";
import * as Switch from "@lattice-ui/react-switch";
import * as System from "@lattice-ui/react-system";
import { SystemProvider } from "@lattice-ui/react-system";
import * as Tabs from "@lattice-ui/react-tabs";
import * as TextField from "@lattice-ui/react-text-field";
import * as Textarea from "@lattice-ui/react-textarea";
import * as Toast from "@lattice-ui/react-toast";
import * as ToggleGroup from "@lattice-ui/react-toggle-group";
import * as Tooltip from "@lattice-ui/react-tooltip";
import * as Recipes from "../../../playground/src/client/theme/recipes";
import * as DocShell from "./DocExampleShell";
import { getDocPortalContainer, useDocTheme } from "./DocExampleShell";

/**
 * What playground code may import. Keyed by the specifier a docs example would
 * actually write — including the relative `./DocExampleShell` and the shared
 * style recipes half the scenes pull in — so an example copied out of this
 * folder runs verbatim.
 */
const PLAYGROUND_MODULES: Record<string, unknown> = {
  "../../../playground/src/client/theme/recipes": Recipes,
  "@lattice-ui/react-accordion": Accordion,
  "@lattice-ui/react-avatar": Avatar,
  "@lattice-ui/react-checkbox": Checkbox,
  "@lattice-ui/react-combobox": Combobox,
  "@lattice-ui/react-runtime": Core,
  "@lattice-ui/react-dialog": Dialog,
  "@lattice-ui/react-layer": Layer,
  "@lattice-ui/react-popover": Popover,
  "@lattice-ui/react-progress": Progress,
  "@lattice-ui/react-radio-group": RadioGroup,
  "@lattice-ui/react-scroll-area": ScrollArea,
  "@lattice-ui/react-select": Select,
  "@lattice-ui/react-slider": Slider,
  "@lattice-ui/react-style": Style,
  "@lattice-ui/react-switch": Switch,
  "@lattice-ui/react-system": System,
  "@lattice-ui/react-tabs": Tabs,
  "@lattice-ui/react-text-field": TextField,
  "@lattice-ui/react-textarea": Textarea,
  "@lattice-ui/react-toast": Toast,
  "@lattice-ui/react-toggle-group": ToggleGroup,
  "@lattice-ui/react-tooltip": Tooltip,
  "./DocExampleShell": DocShell,
};

type CompiledModule = (
  requireModule: (id: string) => unknown,
  moduleExports: Record<string, unknown>,
  module: { exports: Record<string, unknown> },
  react: unknown,
) => void;

type PlaygroundMessage = {
  type?: string;
  code?: string;
  version?: number;
};

type HostMessageEvent = { data?: PlaygroundMessage };

/**
 * The browser globals this scene needs. Declared locally (rather than pulled
 * from `lib.dom`) because the surrounding project is typed against Roblox — the
 * playground is the one target that knowingly talks to its host page.
 */
interface PlaygroundWindow {
  Function: new (...args: Array<string>) => CompiledModule;
  addEventListener: (type: string, listener: (event: HostMessageEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: HostMessageEvent) => void) => void;
  parent: { postMessage: (message: unknown, targetOrigin: string) => void };
}

declare const window: PlaygroundWindow;

function postToHost(message: unknown) {
  window.parent.postMessage(message, "*");
}

function describeError(err: unknown) {
  const asError = err as { message?: unknown } | undefined;
  if (asError && typeIs(asError.message, "string")) {
    return asError.message as string;
  }
  return tostring(err);
}

/**
 * Evaluate one compiled playground module and pull an element out of it.
 * Throws on anything the host should surface as a red error panel.
 */
function evaluate(code: string): React.Element {
  const factory = new window.Function("require", "exports", "module", "React", code);

  const moduleExports: Record<string, unknown> = {};
  factory(
    (id: string) => {
      const found = PLAYGROUND_MODULES[id];
      if (found === undefined) {
        error(`Cannot import "${id}" in the playground.`);
      }
      return found;
    },
    moduleExports,
    { exports: moduleExports },
    React,
  );

  const preview = moduleExports.preview as { render?: () => React.Element } | undefined;
  if (preview && typeIs(preview.render, "function")) {
    return (preview.render as () => React.Element)();
  }

  const fallback = (moduleExports.default ?? moduleExports.App) as React.FunctionComponent | undefined;
  if (fallback !== undefined) {
    return React.createElement(fallback);
  }

  error("Nothing to render — export `const preview = { render: () => <…/> }` or a default component.");
}

function PlaygroundStage() {
  const playerGui = getDocPortalContainer();
  const theme = useDocTheme(playerGui);
  const [content, setContent] = React.useState<React.Element | undefined>(undefined);

  React.useEffect(() => {
    const onMessage = (event: HostMessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "loom-playground-run" || data.code === undefined) {
        return;
      }

      const version = data.version ?? 0;
      try {
        const element = evaluate(data.code);
        // React state setters treat a function argument as an updater, and an
        // element is not one — wrap it so the element itself is stored.
        setContent(() => element);
        postToHost({ type: "loom-playground-result", version, ok: true });
      } catch (err) {
        postToHost({
          type: "loom-playground-result",
          version,
          ok: false,
          message: describeError(err),
        });
      }
    };

    window.addEventListener("message", onMessage);
    postToHost({ type: "loom-playground-ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <PortalProvider container={playerGui}>
      <SystemProvider defaultDensity="comfortable" theme={theme}>
        <frame BackgroundColor3={theme.colors.background} BorderSizePixel={0} Size={UDim2.fromScale(1, 1)}>
          {content ?? (
            <Text
              AnchorPoint={new Vector2(0.5, 0.5)}
              BackgroundTransparency={1}
              Position={UDim2.fromScale(0.5, 0.5)}
              Size={UDim2.fromOffset(320, 20)}
              Text="Waiting for playground code…"
              TextColor3={theme.colors.textSecondary}
              TextSize={theme.typography.labelSm.textSize}
            />
          )}
        </frame>
      </SystemProvider>
    </PortalProvider>
  );
}

export const preview = {
  render: () => <PlaygroundStage />,
  title: "Playground",
} as const;
