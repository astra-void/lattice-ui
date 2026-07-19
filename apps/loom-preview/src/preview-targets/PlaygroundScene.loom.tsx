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
import * as Accordion from "@lattice-ui/accordion";
import * as Avatar from "@lattice-ui/avatar";
import * as Checkbox from "@lattice-ui/checkbox";
import * as Combobox from "@lattice-ui/combobox";
import * as Core from "@lattice-ui/core";
import { React } from "@lattice-ui/core";
import * as Dialog from "@lattice-ui/dialog";
import * as Layer from "@lattice-ui/layer";
import { PortalProvider } from "@lattice-ui/layer";
import * as Popover from "@lattice-ui/popover";
import * as Progress from "@lattice-ui/progress";
import * as RadioGroup from "@lattice-ui/radio-group";
import * as ScrollArea from "@lattice-ui/scroll-area";
import * as Select from "@lattice-ui/select";
import * as Slider from "@lattice-ui/slider";
import * as Style from "@lattice-ui/style";
import { Text } from "@lattice-ui/style";
import * as Switch from "@lattice-ui/switch";
import * as System from "@lattice-ui/system";
import { SystemProvider } from "@lattice-ui/system";
import * as Tabs from "@lattice-ui/tabs";
import * as TextField from "@lattice-ui/text-field";
import * as Textarea from "@lattice-ui/textarea";
import * as Toast from "@lattice-ui/toast";
import * as ToggleGroup from "@lattice-ui/toggle-group";
import * as Tooltip from "@lattice-ui/tooltip";
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
  "@lattice-ui/accordion": Accordion,
  "@lattice-ui/avatar": Avatar,
  "@lattice-ui/checkbox": Checkbox,
  "@lattice-ui/combobox": Combobox,
  "@lattice-ui/core": Core,
  "@lattice-ui/dialog": Dialog,
  "@lattice-ui/layer": Layer,
  "@lattice-ui/popover": Popover,
  "@lattice-ui/progress": Progress,
  "@lattice-ui/radio-group": RadioGroup,
  "@lattice-ui/scroll-area": ScrollArea,
  "@lattice-ui/select": Select,
  "@lattice-ui/slider": Slider,
  "@lattice-ui/style": Style,
  "@lattice-ui/switch": Switch,
  "@lattice-ui/system": System,
  "@lattice-ui/tabs": Tabs,
  "@lattice-ui/text-field": TextField,
  "@lattice-ui/textarea": Textarea,
  "@lattice-ui/toast": Toast,
  "@lattice-ui/toggle-group": ToggleGroup,
  "@lattice-ui/tooltip": Tooltip,
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
