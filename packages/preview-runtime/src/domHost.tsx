import * as React from "react";
import type { Color3Value, UDim2Value, Vector2 } from "./helpers";
import { toCssColor } from "./helpers";
import { type ComputedRect, LayoutNodeParentProvider, useLayoutDebugState, useRobloxLayout } from "./LayoutProvider";
import { mapRobloxFont, useTextScaleStyle } from "./textStyles";

export type PreviewEventTable = {
  Activated?: (event: Event) => void;
  FocusLost?: (event: Event) => void;
};

type ForwardedDomProps = React.HTMLAttributes<HTMLElement> &
  React.InputHTMLAttributes<HTMLInputElement> &
  React.ImgHTMLAttributes<HTMLImageElement>;

type UDimLike = { Scale?: number; Offset?: number; scale?: number; offset?: number } | readonly [number, number];

type UDim2Like =
  | UDim2Value
  | { X?: UDimLike; Y?: UDimLike; x?: UDimLike; y?: UDimLike }
  | readonly [number, number, number, number]
  | readonly [UDimLike, UDimLike];

type Vector2Like = Vector2 | { X?: number; Y?: number; x?: number; y?: number } | readonly [number, number];

type SerializedUDim = {
  Scale: number;
  Offset: number;
};

type SerializedUDim2 = {
  X: SerializedUDim;
  Y: SerializedUDim;
};

type SerializedVector2 = {
  X: number;
  Y: number;
};

type HostModifierName = "uicorner" | "uiscale" | "uistroke";

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
  | "uistroke"
  | "uiscale"
  | "uigradient"
  | "uipagelayout"
  | "uitablelayout"
  | "uisizeconstraint"
  | "uitextsizeconstraint"
  | "uiaspectratioconstraint"
  | "uiflexitem";

type LayoutHostName = "frame" | "textbutton" | "screengui" | "textlabel" | "textbox" | "imagelabel" | "scrollingframe";

let previewNodeIdCounter = 0;
const PREVIEW_DECORATOR_HOST_MARKER = Symbol.for("lattice.preview.decoratorHost");

export type PreviewDomProps = {
  Active?: boolean;
  AnchorPoint?: Vector2Like;
  AutoButtonColor?: boolean;
  AutomaticSize?: string;
  BackgroundColor3?: Color3Value;
  BackgroundTransparency?: number;
  BorderSizePixel?: number;
  CanvasSize?: UDim2Like;
  Change?: {
    Text?: (element: HTMLInputElement) => void;
  };
  Color?: Color3Value;
  CornerRadius?: unknown;
  Event?: PreviewEventTable;
  FillDirection?: string;
  Font?: unknown;
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
  Position?: UDim2Like;
  ScrollBarThickness?: number;
  ScrollingDirection?: string;
  Scale?: number;
  Selectable?: boolean;
  Size?: UDim2Like;
  SortOrder?: string;
  Text?: unknown;
  TextColor3?: Color3Value;
  TextEditable?: boolean;
  TextScaled?: boolean;
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
  anchorPoint: SerializedVector2;
  id?: string;
  name?: string;
  parentId?: string;
  position: SerializedUDim2;
  size?: SerializedUDim2;
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

const ZERO_UDIM: SerializedUDim = {
  Offset: 0,
  Scale: 0,
};

const ZERO_UDIM2: SerializedUDim2 = {
  X: ZERO_UDIM,
  Y: ZERO_UDIM,
};

const FULL_SIZE_UDIM2: SerializedUDim2 = {
  X: {
    Offset: 0,
    Scale: 1,
  },
  Y: {
    Offset: 0,
    Scale: 1,
  },
};

const ZERO_VECTOR2: SerializedVector2 = {
  X: 0,
  Y: 0,
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

function coerceTextValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function serializeUDim(value: unknown, fallback: SerializedUDim = ZERO_UDIM): SerializedUDim {
  if (Array.isArray(value)) {
    return {
      Offset: toFiniteNumber(value[1], fallback.Offset),
      Scale: toFiniteNumber(value[0], fallback.Scale),
    };
  }

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as { Offset?: number; Scale?: number; offset?: number; scale?: number };
  return {
    Offset: toFiniteNumber(record.Offset ?? record.offset, fallback.Offset),
    Scale: toFiniteNumber(record.Scale ?? record.scale, fallback.Scale),
  };
}

function serializeUDim2(value: unknown, fallback?: SerializedUDim2): SerializedUDim2 | undefined {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (Array.isArray(value)) {
    if (value.length >= 4) {
      return {
        X: serializeUDim([value[0], value[1]], fallback?.X ?? ZERO_UDIM),
        Y: serializeUDim([value[2], value[3]], fallback?.Y ?? ZERO_UDIM),
      };
    }

    return {
      X: serializeUDim(value[0], fallback?.X ?? ZERO_UDIM),
      Y: serializeUDim(value[1], fallback?.Y ?? ZERO_UDIM),
    };
  }

  if (typeof value !== "object") {
    return fallback;
  }

  const record = value as { X?: unknown; Y?: unknown; x?: unknown; y?: unknown };
  return {
    X: serializeUDim(record.X ?? record.x, fallback?.X ?? ZERO_UDIM),
    Y: serializeUDim(record.Y ?? record.y, fallback?.Y ?? ZERO_UDIM),
  };
}

function serializeVector2(value: unknown, fallback: SerializedVector2 = ZERO_VECTOR2): SerializedVector2 {
  if (Array.isArray(value)) {
    return {
      X: toFiniteNumber(value[0], fallback.X),
      Y: toFiniteNumber(value[1], fallback.Y),
    };
  }

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as { X?: number; Y?: number; x?: number; y?: number };
  return {
    X: toFiniteNumber(record.X ?? record.x, fallback.X),
    Y: toFiniteNumber(record.Y ?? record.y, fallback.Y),
  };
}

function getDecoratorHost(type: unknown) {
  if (typeof type !== "object" && typeof type !== "function") {
    return undefined;
  }

  return (type as { [PREVIEW_DECORATOR_HOST_MARKER]?: HostModifierName })[PREVIEW_DECORATOR_HOST_MARKER];
}

function toTransformOrigin(anchorPoint: SerializedVector2) {
  return `${anchorPoint.X * 100}% ${anchorPoint.Y * 100}%`;
}

function resolveCornerRadius(value: unknown, computed: ComputedRect | null) {
  const radius = serializeUDim(value);
  const referenceSize = computed ? Math.min(computed.width, computed.height) : 0;
  return `${Math.max(0, referenceSize * radius.Scale + radius.Offset)}px`;
}

function appendStyleValue(
  existing: React.CSSProperties[keyof React.CSSProperties] | undefined,
  next: string,
  separator: string,
) {
  if (!existing) {
    return next;
  }

  return `${String(existing)}${separator}${next}`;
}

type HoistedModifierState = {
  cornerRadius?: string;
  scale?: number;
  strokeShadow?: string;
};

function collectHoistedModifierState(
  state: HoistedModifierState,
  host: HostModifierName,
  props: PreviewDomProps,
  computed: ComputedRect | null,
) {
  switch (host) {
    case "uicorner":
      state.cornerRadius = resolveCornerRadius(props.CornerRadius, computed);
      break;
    case "uiscale":
      state.scale = toFiniteNumber(props.Scale, 1);
      break;
    case "uistroke": {
      const thickness = Math.max(0, toFiniteNumber(props.Thickness, 1));
      const color = props.Color ? toCssColor(props.Color, props.Transparency) : undefined;
      if (thickness > 0 && color) {
        state.strokeShadow = `inset 0 0 0 ${thickness}px ${color}`;
      }
      break;
    }
  }
}

function collectRenderableChildren(
  children: React.ReactNode,
  state: HoistedModifierState,
  computed: ComputedRect | null,
): React.ReactNode[] {
  const renderableChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      if (child !== undefined && child !== null && child !== false) {
        renderableChildren.push(child);
      }
      return;
    }

    const decoratorHost = getDecoratorHost(child.type);
    if (decoratorHost) {
      collectHoistedModifierState(state, decoratorHost, child.props as PreviewDomProps, computed);
      return;
    }

    if (child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode };
      const fragmentChildren = collectRenderableChildren(fragmentProps.children, state, computed);
      if (fragmentChildren.length > 0) {
        renderableChildren.push(React.cloneElement(child, undefined, ...fragmentChildren));
      }
      return;
    }

    renderableChildren.push(child);
  });

  return renderableChildren;
}

function extractHoistedChildren(children: React.ReactNode, computed: ComputedRect | null) {
  const state: HoistedModifierState = {};
  const renderableChildren = collectRenderableChildren(children, state, computed);

  return {
    children: renderableChildren,
    state,
  };
}

function applyHoistedModifierStyles(
  style: React.CSSProperties,
  state: HoistedModifierState,
  anchorPoint: SerializedVector2,
) {
  if (state.cornerRadius) {
    style.borderRadius = state.cornerRadius;
  }

  if (state.scale !== undefined && Number.isFinite(state.scale) && state.scale !== 1) {
    style.transform = appendStyleValue(style.transform, `scale(${state.scale})`, " ");
    style.transformOrigin = toTransformOrigin(anchorPoint);
  }

  if (state.strokeShadow) {
    style.boxShadow = appendStyleValue(style.boxShadow, state.strokeShadow, ", ");
  }
}

function getDefaultSize(host: LayoutHostName) {
  if (host === "frame" || host === "screengui") {
    return FULL_SIZE_UDIM2;
  }

  return undefined;
}

function getLayoutInput(host: LayoutHostName, props: PreviewDomProps): LayoutInput {
  const source = props as Record<string, unknown>;

  return {
    anchorPoint: serializeVector2(source.AnchorPoint ?? source.anchorPoint),
    id: getStringValue(source.Id ?? source.id),
    name: getStringValue(source.Name ?? source.name),
    parentId: getStringValue(source.ParentId ?? source.parentId),
    position: serializeUDim2(source.Position ?? source.position, ZERO_UDIM2) ?? ZERO_UDIM2,
    size: serializeUDim2(source.Size ?? source.size, getDefaultSize(host)),
  };
}

function normalizePreviewNodeId(nodeId: string | undefined) {
  if (!nodeId) {
    return undefined;
  }

  const match = /(?:^|:)(preview-node-\d+)$/.exec(nodeId);
  return match?.[1] ?? nodeId;
}

function useGeneratedPreviewNodeId() {
  const idRef = React.useRef<string | null>(null);
  if (idRef.current === null) {
    previewNodeIdCounter += 1;
    idRef.current = `preview-node-${previewNodeIdCounter}`;
  }

  return idRef.current;
}

function resolveNodeId(_host: HostName, generatedId: string, layoutInput: LayoutInput) {
  return normalizePreviewNodeId(layoutInput.id) ?? generatedId;
}

type LayoutDebugState = ReturnType<typeof useLayoutDebugState>;

function toDebugAttributeValue(
  value: React.CSSProperties[keyof React.CSSProperties] | number | string | undefined | null,
) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function withLayoutDiagnostics(
  domProps: React.HTMLAttributes<HTMLElement>,
  computed: ComputedRect | null,
  diagnostics: LayoutDebugState,
) {
  const style = domProps.style as React.CSSProperties | undefined;

  return {
    ...domProps,
    "data-layout-computed-height": computed?.height ?? undefined,
    "data-layout-computed-width": computed?.width ?? undefined,
    "data-layout-context": diagnostics.hasContext ? "true" : "false",
    "data-layout-parent-height": diagnostics.inheritedParentRect?.height ?? undefined,
    "data-layout-parent-width": diagnostics.inheritedParentRect?.width ?? undefined,
    "data-layout-style-height": toDebugAttributeValue(style?.height),
    "data-layout-style-width": toDebugAttributeValue(style?.width),
    "data-layout-viewport-height": diagnostics.viewport?.height ?? undefined,
    "data-layout-viewport-ready": diagnostics.viewportReady ? "true" : "false",
    "data-layout-viewport-width": diagnostics.viewport?.width ?? undefined,
  };
}

function useHostLayout(host: LayoutHostName, props: PreviewDomProps) {
  const generatedId = useGeneratedPreviewNodeId();
  const layoutInput = React.useMemo(() => getLayoutInput(host, props), [host, props]);
  const normalizedParentId = React.useMemo(() => normalizePreviewNodeId(layoutInput.parentId), [layoutInput.parentId]);

  const nodeId = React.useMemo(
    () => resolveNodeId(host, generatedId, layoutInput),
    [generatedId, host, layoutInput.id],
  );

  const nodeData = React.useMemo(
    () => ({
      anchorPoint: layoutInput.anchorPoint,
      id: nodeId,
      nodeType: layoutHostNodeType[host],
      parentId: normalizedParentId,
      position: layoutInput.position,
      size: layoutInput.size,
    }),
    [host, layoutInput.anchorPoint, layoutInput.position, layoutInput.size, nodeId, normalizedParentId],
  );

  const computed = useRobloxLayout(nodeData);
  const diagnostics = useLayoutDebugState();

  return {
    computed,
    diagnostics,
    nodeId,
  };
}

function withNodeParent(nodeId: string, rect: ComputedRect | null, children: React.ReactNode) {
  return (
    <LayoutNodeParentProvider nodeId={nodeId} rect={rect}>
      {children}
    </LayoutNodeParentProvider>
  );
}

function applyComputedLayout(style: React.CSSProperties, computed: ComputedRect | null) {
  delete style.left;
  delete style.top;
  delete style.width;
  delete style.height;
  delete style.transform;
  delete style.translate;

  style.position = "absolute";

  if (!computed) {
    style.visibility = "hidden";
    return;
  }

  style.visibility = "visible";
  style.left = `${computed.x}px`;
  style.top = `${computed.y}px`;
  style.width = `${computed.width}px`;
  style.height = `${computed.height}px`;
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
    Color,
    CornerRadius,
    Event,
    Font,
    Id,
    Image,
    ImageColor3,
    ImageTransparency,
    Modal,
    Name,
    ParentId,
    PlaceholderText,
    Position,
    Scale,
    Selectable,
    Size,
    Text,
    TextColor3,
    TextEditable,
    TextScaled,
    TextSize,
    TextTransparency,
    TextWrapped,
    TextXAlignment,
    TextYAlignment,
    Thickness,
    Transparency,
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
  void Color;
  void CornerRadius;
  void Font;
  void Id;
  void ImageColor3;
  void ImageTransparency;
  void Modal;
  void Name;
  void ParentId;
  void Position;
  void Scale;
  void Size;
  void TextScaled;
  void TextTransparency;
  void Thickness;
  void Transparency;

  const forwarded = pickForwardedDomProps(rest);
  const computedStyle: React.CSSProperties = {
    ...(style ?? {}),
  };

  if (options.applyComputedLayout !== false) {
    applyComputedLayout(computedStyle, options.computed);
  }

  computedStyle.boxSizing = computedStyle.boxSizing ?? "border-box";
  computedStyle.flexShrink = computedStyle.flexShrink ?? 0;
  computedStyle.margin = computedStyle.margin ?? 0;
  computedStyle.minHeight = computedStyle.minHeight ?? 0;
  computedStyle.minWidth = computedStyle.minWidth ?? 0;
  computedStyle.padding = computedStyle.padding ?? 0;

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

  const fontStyle = mapRobloxFont(Font);
  if (fontStyle.fontFamily) {
    computedStyle.fontFamily = fontStyle.fontFamily;
  }
  if (fontStyle.fontStyle) {
    computedStyle.fontStyle = fontStyle.fontStyle;
  }
  if (fontStyle.fontWeight) {
    computedStyle.fontWeight = fontStyle.fontWeight;
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
    computedStyle.overflowWrap = "break-word";
  } else if (options.host === "textbutton" || options.host === "textlabel" || options.host === "textbox") {
    computedStyle.whiteSpace = "pre";
  }

  if (options.host === "textbutton" || options.host === "textlabel") {
    computedStyle.display = computedStyle.display === "none" ? "none" : "flex";
    computedStyle.flexDirection = "column";
    computedStyle.justifyContent = toJustifyContent(TextYAlignment);
    computedStyle.textAlign = toTextAlign(TextXAlignment);
  }

  if (options.host === "textbox") {
    computedStyle.textAlign = toTextAlign(TextXAlignment);
  }

  if (options.host === "textbutton" || options.host === "textbox") {
    computedStyle.appearance = computedStyle.appearance ?? "none";
    computedStyle.backgroundClip = computedStyle.backgroundClip ?? "padding-box";
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
    text: coerceTextValue(Text),
  };
}

function useMergedRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return React.useCallback(
    (value: T | null) => {
      for (const ref of refs) {
        if (!ref) {
          continue;
        }

        if (typeof ref === "function") {
          ref(value);
          continue;
        }

        (ref as React.MutableRefObject<T | null>).current = value;
      }
    },
    [refs],
  );
}

function prepareResolvedHost(
  props: PreviewDomProps,
  resolved: ReturnType<typeof resolvePreviewDomProps>,
  computed: ComputedRect | null,
) {
  const { children, state } = extractHoistedChildren(resolved.children, computed);
  const domStyle = {
    ...(resolved.domProps.style as React.CSSProperties | undefined),
  };

  applyHoistedModifierStyles(domStyle, state, serializeVector2(props.AnchorPoint));

  return {
    ...resolved,
    children,
    domProps: {
      ...resolved.domProps,
      style: domStyle,
    },
  };
}

function renderHostText(text: string | undefined) {
  if (!text) {
    return undefined;
  }

  return (
    <span
      className="preview-host-text"
      style={{
        display: "block",
        width: "100%",
      }}
    >
      {text}
    </span>
  );
}

function createDecoratorHost(displayName: string, host: HostName) {
  const Component = React.forwardRef<HTMLElement, PreviewDomProps>(() => null);

  Component.displayName = displayName;
  if (host === "uicorner" || host === "uiscale" || host === "uistroke") {
    (Component as typeof Component & { [PREVIEW_DECORATOR_HOST_MARKER]?: HostModifierName })[
      PREVIEW_DECORATOR_HOST_MARKER
    ] = host;
  }
  return Component;
}

export const Frame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("frame", props);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "frame",
      nodeId,
    }),
    computed,
  );

  return (
    <div
      {...withLayoutDiagnostics(prepared.domProps, computed, diagnostics)}
      ref={forwardedRef as React.Ref<HTMLDivElement>}
    >
      {renderHostText(prepared.text)}
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
Frame.displayName = "PreviewFrame";

export const TextButton = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("textbutton", props);
  const innerRef = React.useRef<HTMLButtonElement | null>(null);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLButtonElement>, innerRef);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "textbutton",
      nodeId,
    }),
    computed,
  );
  const textScaleStyle = useTextScaleStyle({
    elementRef: innerRef,
    enabled: props.TextScaled === true,
    fontFamily: prepared.domProps.style?.fontFamily as string | undefined,
    fontStyle: prepared.domProps.style?.fontStyle as React.CSSProperties["fontStyle"] | undefined,
    fontWeight: prepared.domProps.style?.fontWeight as React.CSSProperties["fontWeight"] | undefined,
    lineHeight: prepared.domProps.style?.lineHeight,
    text: prepared.text,
    wrapped: props.TextWrapped === true,
  });
  const domProps = React.useMemo(
    () => ({
      ...prepared.domProps,
      style: {
        ...(prepared.domProps.style as React.CSSProperties | undefined),
        ...(textScaleStyle ?? {}),
      },
    }),
    [prepared.domProps, textScaleStyle],
  );

  return (
    <button
      {...withLayoutDiagnostics(domProps, computed, diagnostics)}
      disabled={prepared.disabled}
      ref={mergedRef}
      type="button"
    >
      {renderHostText(prepared.text)}
      {withNodeParent(nodeId, computed, prepared.children)}
    </button>
  );
});
TextButton.displayName = "PreviewTextButton";

export const ScreenGui = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("screengui", props);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "screengui",
      nodeId,
    }),
    computed,
  );

  return (
    <div
      {...withLayoutDiagnostics(prepared.domProps, computed, diagnostics)}
      ref={forwardedRef as React.Ref<HTMLDivElement>}
    >
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
ScreenGui.displayName = "PreviewScreenGui";

export const TextLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("textlabel", props);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLDivElement>, innerRef);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "textlabel",
      nodeId,
    }),
    computed,
  );
  const textScaleStyle = useTextScaleStyle({
    elementRef: innerRef,
    enabled: props.TextScaled === true,
    fontFamily: prepared.domProps.style?.fontFamily as string | undefined,
    fontStyle: prepared.domProps.style?.fontStyle as React.CSSProperties["fontStyle"] | undefined,
    fontWeight: prepared.domProps.style?.fontWeight as React.CSSProperties["fontWeight"] | undefined,
    lineHeight: prepared.domProps.style?.lineHeight,
    text: prepared.text,
    wrapped: props.TextWrapped === true,
  });
  const domProps = React.useMemo(
    () => ({
      ...prepared.domProps,
      style: {
        ...(prepared.domProps.style as React.CSSProperties | undefined),
        ...(textScaleStyle ?? {}),
      },
    }),
    [prepared.domProps, textScaleStyle],
  );

  return (
    <div {...withLayoutDiagnostics(domProps, computed, diagnostics)} ref={mergedRef}>
      {renderHostText(prepared.text)}
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
TextLabel.displayName = "PreviewTextLabel";

export const TextBox = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("textbox", props);
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLInputElement>, innerRef);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "textbox",
      nodeId,
    }),
    computed,
  );
  const textScaleStyle = useTextScaleStyle({
    elementRef: innerRef,
    enabled: props.TextScaled === true,
    fontFamily: prepared.domProps.style?.fontFamily as string | undefined,
    fontStyle: prepared.domProps.style?.fontStyle as React.CSSProperties["fontStyle"] | undefined,
    fontWeight: prepared.domProps.style?.fontWeight as React.CSSProperties["fontWeight"] | undefined,
    lineHeight: prepared.domProps.style?.lineHeight,
    text: prepared.text,
    wrapped: props.TextWrapped === true,
  });
  const domProps = React.useMemo(
    () => ({
      ...prepared.domProps,
      style: {
        ...(prepared.domProps.style as React.CSSProperties | undefined),
        ...(textScaleStyle ?? {}),
      },
    }),
    [prepared.domProps, textScaleStyle],
  );

  return (
    <input
      {...withLayoutDiagnostics(domProps, computed, diagnostics)}
      defaultValue={prepared.text}
      disabled={prepared.disabled}
      ref={mergedRef}
      type="text"
    />
  );
});
TextBox.displayName = "PreviewTextBox";

export const ImageLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("imagelabel", props);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "imagelabel",
      nodeId,
    }),
    computed,
  );

  return (
    <img
      {...withLayoutDiagnostics(prepared.domProps, computed, diagnostics)}
      alt=""
      ref={forwardedRef as React.Ref<HTMLImageElement>}
      src={typeof prepared.image === "string" ? prepared.image : undefined}
    />
  );
});
ImageLabel.displayName = "PreviewImageLabel";

export const ScrollingFrame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, nodeId } = useHostLayout("scrollingframe", props);
  const prepared = prepareResolvedHost(
    props,
    resolvePreviewDomProps(props, {
      computed,
      host: "scrollingframe",
      nodeId,
    }),
    computed,
  );

  return (
    <div
      {...withLayoutDiagnostics(prepared.domProps, computed, diagnostics)}
      ref={forwardedRef as React.Ref<HTMLDivElement>}
    >
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
ScrollingFrame.displayName = "PreviewScrollingFrame";

export const UICorner = createDecoratorHost("PreviewUICorner", "uicorner");
export const UIPadding = createDecoratorHost("PreviewUIPadding", "uipadding");
export const UIListLayout = createDecoratorHost("PreviewUIListLayout", "uilistlayout");
export const UIGridLayout = createDecoratorHost("PreviewUIGridLayout", "uigridlayout");
export const UIStroke = createDecoratorHost("PreviewUIStroke", "uistroke");
export const UIScale = createDecoratorHost("PreviewUIScale", "uiscale");
export const UIGradient = createDecoratorHost("PreviewUIGradient", "uigradient");
export const UIPageLayout = createDecoratorHost("PreviewUIPageLayout", "uipagelayout");
export const UITableLayout = createDecoratorHost("PreviewUITableLayout", "uitablelayout");
export const UISizeConstraint = createDecoratorHost("PreviewUISizeConstraint", "uisizeconstraint");
export const UITextSizeConstraint = createDecoratorHost("PreviewUITextSizeConstraint", "uitextsizeconstraint");
export const UIAspectRatioConstraint = createDecoratorHost("PreviewUIAspectRatioConstraint", "uiaspectratioconstraint");
export const UIFlexItem = createDecoratorHost("PreviewUIFlexItem", "uiflexitem");
