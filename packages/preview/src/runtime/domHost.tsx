import * as React from "react";
import type { Color3Value, UDim2Value, Vector2 } from "./helpers";
import { toCssColor } from "./helpers";
import { LayoutNodeParentProvider, type ComputedRect, useRobloxLayout } from "./LayoutProvider";

export type PreviewEventTable = {
  Activated?: (event: Event) => void;
  FocusLost?: (event: Event) => void;
};

type ForwardedDomProps = React.HTMLAttributes<HTMLElement> &
  React.InputHTMLAttributes<HTMLInputElement> &
  React.ImgHTMLAttributes<HTMLImageElement>;

type Vector2Like = Vector2 | { X?: number; Y?: number; x?: number; y?: number };

type HostName =
  | "frame"
  | "textbutton"
  | "screengui"
  | "textlabel"
  | "textbox"
  | "imagelabel"
  | "scrollingframe"
  | "uicorner"
  | "uipadding"
  | "uilistlayout"
  | "uigridlayout"
  | "uistroke";

type LayoutHostName =
  | "frame"
  | "textbutton"
  | "screengui"
  | "textlabel"
  | "textbox"
  | "imagelabel"
  | "scrollingframe";

export type PreviewDomProps = {
  Active?: boolean;
  AnchorPoint?: Vector2Like;
  AutoButtonColor?: boolean;
  AutomaticSize?: string;
  BackgroundColor3?: Color3Value;
  BackgroundTransparency?: number;
  BorderSizePixel?: number;
  CanvasSize?: UDim2Value;
  Change?: {
    Text?: (element: HTMLInputElement) => void;
  };
  CornerRadius?: unknown;
  Event?: PreviewEventTable;
  FillDirection?: string;
  HorizontalAlignment?: string;
  Id?: string;
  Image?: string;
  ImageColor3?: Color3Value;
  ImageTransparency?: number;
  Modal?: boolean;
  Name?: string;
  PaddingBottom?: unknown;
  PaddingLeft?: unknown;
  PaddingRight?: unknown;
  PaddingTop?: unknown;
  Padding?: unknown;
  ParentId?: string;
  PlaceholderText?: string;
  Position?: UDim2Value;
  ScrollBarThickness?: number;
  ScrollingDirection?: string;
  Selectable?: boolean;
  Size?: UDim2Value;
  SortOrder?: string;
  Text?: string;
  TextColor3?: Color3Value;
  TextEditable?: boolean;
  TextSize?: number;
  TextTransparency?: number;
  TextWrapped?: boolean;
  TextXAlignment?: string;
  TextYAlignment?: string;
  Thickness?: number;
  Transparency?: number;
  VerticalAlignment?: string;
  Visible?: boolean;
  ZIndex?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
} & ForwardedDomProps;

const DOM_PROP_NAMES = new Set([
  "children",
  "className",
  "defaultValue",
  "id",
  "onBlur",
  "onChange",
  "onClick",
  "onFocus",
  "onInput",
  "onKeyDown",
  "onKeyUp",
  "onMouseDown",
  "onMouseEnter",
  "onMouseLeave",
  "onPointerDown",
  "onPointerMove",
  "onPointerUp",
  "placeholder",
  "role",
  "style",
  "tabIndex",
  "title",
  "value",
]);

type ResolveOptions = {
  applyComputedLayout?: boolean;
  computed: ComputedRect | null;
  host: HostName;
  nodeId: string;
};

type LayoutInput = {
  anchorPoint?: Vector2Like;
  id?: string;
  name?: string;
  parentId?: string;
  position?: UDim2Value;
  size?: UDim2Value;
};

const layoutHostNodeType: Record<LayoutHostName, string> = {
  frame: "Frame",
  textbutton: "TextButton",
  screengui: "ScreenGui",
  textlabel: "TextLabel",
  textbox: "TextBox",
  imagelabel: "ImageLabel",
  scrollingframe: "ScrollingFrame",
};

function mergeHandlers<T>(a?: (event: T) => void, b?: (event: T) => void) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return (event: T) => {
    a(event);
    b(event);
  };
}

function toTextAlign(value: string | undefined) {
  switch (value) {
    case "center":
      return "center";
    case "right":
      return "right";
    default:
      return "left";
  }
}

function toJustifyContent(value: string | undefined) {
  switch (value) {
    case "center":
      return "center";
    case "bottom":
      return "flex-end";
    default:
      return "flex-start";
  }
}

function pickForwardedDomProps(props: PreviewDomProps) {
  const domProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("aria-") || key.startsWith("data-") || DOM_PROP_NAMES.has(key)) {
      domProps[key] = value;
    }
  }

  return domProps;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getLayoutInput(props: PreviewDomProps): LayoutInput {
  const source = props as Record<string, unknown>;

  return {
    anchorPoint: source.AnchorPoint as Vector2Like | undefined,
    id: getStringValue(source.Id),
    name: getStringValue(source.Name),
    parentId: getStringValue(source.ParentId),
    position: source.Position as UDim2Value | undefined,
    size: source.Size as UDim2Value | undefined,
  };
}

function resolveNodeId(host: HostName, reactId: string, layoutInput: LayoutInput) {
  if (layoutInput.id && layoutInput.id.length > 0) {
    return layoutInput.id;
  }

  if (layoutInput.name && layoutInput.name.length > 0) {
    return `${host}:${layoutInput.name}:${reactId}`;
  }

  return `${host}:${reactId}`;
}

function useHostLayout(host: LayoutHostName, props: PreviewDomProps) {
  const reactId = React.useId();
  const layoutInput = getLayoutInput(props);

  const nodeId = React.useMemo(
    () => resolveNodeId(host, reactId, layoutInput),
    [host, layoutInput.id, layoutInput.name, reactId],
  );

  const computed = useRobloxLayout({
    anchorPoint: layoutInput.anchorPoint,
    id: nodeId,
    nodeType: layoutHostNodeType[host],
    parentId: layoutInput.parentId,
    position: layoutInput.position,
    size: layoutInput.size,
  });

  return {
    computed,
    nodeId,
  };
}

function withNodeParent(nodeId: string, children: React.ReactNode) {
  return <LayoutNodeParentProvider nodeId={nodeId}>{children}</LayoutNodeParentProvider>;
}

function applyComputedLayout(style: React.CSSProperties, computed: ComputedRect | null) {
  style.position = "absolute";

  if (!computed) {
    style.left = "0px";
    style.top = "0px";
    style.width = "0px";
    style.height = "0px";
    style.visibility = "hidden";
    return;
  }

  style.left = `${computed.x}px`;
  style.top = `${computed.y}px`;
  style.width = `${computed.width}px`;
  style.height = `${computed.height}px`;
  style.visibility = "visible";
}

export function resolvePreviewDomProps(props: PreviewDomProps, options: ResolveOptions) {
  const {
    Active,
    AnchorPoint,
    AutoButtonColor,
    BackgroundColor3,
    BackgroundTransparency,
    BorderSizePixel,
    Change,
    Event,
    Id,
    Image,
    Modal,
    Name,
    ParentId,
    PlaceholderText,
    Position,
    Selectable,
    Size,
    Text,
    TextColor3,
    TextEditable,
    TextSize,
    TextTransparency,
    TextWrapped,
    TextXAlignment,
    TextYAlignment,
    Visible,
    ZIndex,
    children,
    className,
    onBlur,
    onChange,
    onClick,
    style,
    ...rest
  } = props;

  void Active;
  void AnchorPoint;
  void AutoButtonColor;
  void Id;
  void Modal;
  void Name;
  void ParentId;
  void Position;
  void Size;
  void TextTransparency;

  const forwarded = pickForwardedDomProps(rest);
  const computedStyle: React.CSSProperties = {
    ...(style ?? {}),
  };

  if (options.applyComputedLayout !== false) {
    applyComputedLayout(computedStyle, options.computed);
  }

  if (Visible === false) {
    computedStyle.display = "none";
  }

  if (ZIndex !== undefined) {
    computedStyle.zIndex = ZIndex;
  }

  if (BackgroundColor3) {
    computedStyle.backgroundColor = toCssColor(BackgroundColor3, BackgroundTransparency);
  } else if (BackgroundTransparency === 1) {
    computedStyle.backgroundColor = "transparent";
  }

  if (TextColor3) {
    computedStyle.color = toCssColor(TextColor3);
  }

  if (TextSize !== undefined) {
    computedStyle.fontSize = `${TextSize}px`;
    computedStyle.lineHeight = 1.2;
  }

  if (BorderSizePixel === 0) {
    computedStyle.border = "none";
  } else if (BorderSizePixel !== undefined) {
    computedStyle.borderStyle = "solid";
    computedStyle.borderWidth = `${BorderSizePixel}px`;
    computedStyle.borderColor = "transparent";
  }

  if (TextWrapped) {
    computedStyle.whiteSpace = "pre-wrap";
  }

  if (options.host === "textlabel" || options.host === "textbox") {
    computedStyle.display = computedStyle.display === "none" ? "none" : "flex";
    computedStyle.flexDirection = "column";
    computedStyle.justifyContent = toJustifyContent(TextYAlignment);
    computedStyle.textAlign = toTextAlign(TextXAlignment);
  }

  if (options.host === "imagelabel") {
    computedStyle.objectFit = "cover";
  }

  if (options.host === "scrollingframe") {
    computedStyle.overflow = "auto";
  }

  const mergedClick = mergeHandlers<React.MouseEvent<HTMLElement>>(
    onClick,
    Event?.Activated
      ? (event) => {
          Event.Activated?.(event.nativeEvent);
        }
      : undefined,
  );
  const mergedBlur = mergeHandlers<React.FocusEvent<HTMLElement>>(
    onBlur,
    Event?.FocusLost
      ? (event) => {
          Event.FocusLost?.(event.nativeEvent);
        }
      : undefined,
  );
  const mergedChange = mergeHandlers<React.ChangeEvent<HTMLElement>>(
    onChange as ((event: React.ChangeEvent<HTMLElement>) => void) | undefined,
    Change?.Text
      ? (event) => {
          if (event.target instanceof HTMLInputElement) {
            Change.Text?.(event.target);
          }
        }
      : undefined,
  );

  return {
    children,
    disabled: options.host === "textbutton" ? props.Active === false : TextEditable === false,
    domProps: {
      ...forwarded,
      "data-preview-host": options.host,
      "data-preview-node-id": options.nodeId,
      className: ["preview-host", `preview-${options.host}`, className].filter(Boolean).join(" "),
      onBlur: mergedBlur,
      onChange: mergedChange,
      onClick: mergedClick,
      placeholder: PlaceholderText,
      style: computedStyle,
      tabIndex: Selectable === false ? -1 : (forwarded.tabIndex as number | undefined),
    },
    image: Image,
    text: Text,
  };
}

function createDecoratorHost(displayName: string, host: HostName) {
  const Component = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
    const nodeId = React.useId();
    const resolved = resolvePreviewDomProps(props, {
      applyComputedLayout: false,
      computed: null,
      host,
      nodeId,
    });

    const style = {
      ...(resolved.domProps.style as React.CSSProperties),
      display: "none",
    };

    return (
      <span
        {...resolved.domProps}
        aria-hidden="true"
        ref={forwardedRef as React.Ref<HTMLSpanElement>}
        style={style}
      />
    );
  });

  Component.displayName = displayName;
  return Component;
}

export const Frame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("frame", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "frame",
    nodeId,
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.text ? <span className="preview-host-text">{resolved.text}</span> : undefined}
      {withNodeParent(nodeId, resolved.children)}
    </div>
  );
});
Frame.displayName = "PreviewFrame";

export const TextButton = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("textbutton", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "textbutton",
    nodeId,
  });

  return (
    <button
      {...resolved.domProps}
      disabled={resolved.disabled}
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
      type="button"
    >
      {resolved.text ? <span className="preview-host-text">{resolved.text}</span> : undefined}
      {withNodeParent(nodeId, resolved.children)}
    </button>
  );
});
TextButton.displayName = "PreviewTextButton";

export const ScreenGui = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("screengui", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "screengui",
    nodeId,
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {withNodeParent(nodeId, resolved.children)}
    </div>
  );
});
ScreenGui.displayName = "PreviewScreenGui";

export const TextLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("textlabel", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "textlabel",
    nodeId,
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.text}
      {withNodeParent(nodeId, resolved.children)}
    </div>
  );
});
TextLabel.displayName = "PreviewTextLabel";

export const TextBox = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("textbox", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "textbox",
    nodeId,
  });

  return (
    <input
      {...resolved.domProps}
      defaultValue={resolved.text}
      disabled={resolved.disabled}
      ref={forwardedRef as React.Ref<HTMLInputElement>}
      type="text"
    />
  );
});
TextBox.displayName = "PreviewTextBox";

export const ImageLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("imagelabel", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "imagelabel",
    nodeId,
  });

  return (
    <img
      {...resolved.domProps}
      alt=""
      ref={forwardedRef as React.Ref<HTMLImageElement>}
      src={typeof resolved.image === "string" ? resolved.image : undefined}
    />
  );
});
ImageLabel.displayName = "PreviewImageLabel";

export const ScrollingFrame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, nodeId } = useHostLayout("scrollingframe", props);
  const resolved = resolvePreviewDomProps(props, {
    computed,
    host: "scrollingframe",
    nodeId,
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {withNodeParent(nodeId, resolved.children)}
    </div>
  );
});
ScrollingFrame.displayName = "PreviewScrollingFrame";

export const UICorner = createDecoratorHost("PreviewUICorner", "uicorner");
export const UIPadding = createDecoratorHost("PreviewUIPadding", "uipadding");
export const UIListLayout = createDecoratorHost("PreviewUIListLayout", "uilistlayout");
export const UIGridLayout = createDecoratorHost("PreviewUIGridLayout", "uigridlayout");
export const UIStroke = createDecoratorHost("PreviewUIStroke", "uistroke");
