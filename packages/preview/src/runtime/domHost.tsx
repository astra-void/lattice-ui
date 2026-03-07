import * as React from "react";
import type { Color3Value, UDim2Value, UDim, Vector2 } from "./helpers";
import { toCssColor, toCssLength } from "./helpers";
import { type LayoutRect, computeNodeRectWithWasm } from "./layoutEngine";

export type PreviewEventTable = {
  Activated?: (event: Event) => void;
  FocusLost?: (event: Event) => void;
};

type ForwardedDomProps = React.HTMLAttributes<HTMLElement> &
  React.InputHTMLAttributes<HTMLInputElement> &
  React.ImgHTMLAttributes<HTMLImageElement>;

type Vector2Like = Vector2 | { X?: number; Y?: number; x?: number; y?: number };

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
  Image?: string;
  ImageColor3?: Color3Value;
  ImageTransparency?: number;
  Modal?: boolean;
  PaddingBottom?: unknown;
  PaddingLeft?: unknown;
  PaddingRight?: unknown;
  PaddingTop?: unknown;
  Padding?: unknown;
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

const LayoutRectContext = React.createContext<LayoutRect | null>(null);

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

type ResolveOptions = {
  host: HostName;
  parentRect?: LayoutRect | null;
  wasmRect?: LayoutRect | null;
};

function hostToNodeType(host: HostName) {
  switch (host) {
    case "frame":
      return "Frame";
    case "textbutton":
      return "TextButton";
    case "screengui":
      return "ScreenGui";
    case "textlabel":
      return "TextLabel";
    case "textbox":
      return "TextBox";
    case "imagelabel":
      return "ImageLabel";
    case "scrollingframe":
      return "ScrollingFrame";
    case "uicorner":
      return "UICorner";
    case "uipadding":
      return "UIPadding";
    case "uilistlayout":
      return "UIListLayout";
    case "uigridlayout":
      return "UIGridLayout";
    case "uistroke":
      return "UIStroke";
    default:
      return "Frame";
  }
}

function toSolverUDim(axis: UDim | undefined) {
  return {
    scale: Number(axis?.Scale ?? 0),
    offset: Number(axis?.Offset ?? 0),
  };
}

function toSolverUDim2(value: UDim2Value | undefined) {
  return {
    x: toSolverUDim(value?.X),
    y: toSolverUDim(value?.Y),
  };
}

function toSolverVector2(value: Vector2Like | undefined) {
  return {
    x: Number((value as { X?: number; x?: number } | undefined)?.X ?? (value as { x?: number } | undefined)?.x ?? 0),
    y: Number((value as { Y?: number; y?: number } | undefined)?.Y ?? (value as { y?: number } | undefined)?.y ?? 0),
  };
}

function hasFiniteLayoutValues(size: UDim2Value | undefined, position: UDim2Value | undefined, anchorPoint: Vector2Like | undefined) {
  const dimensions = [
    Number(size?.X?.Scale),
    Number(size?.X?.Offset),
    Number(size?.Y?.Scale),
    Number(size?.Y?.Offset),
    Number(position?.X?.Scale ?? 0),
    Number(position?.X?.Offset ?? 0),
    Number(position?.Y?.Scale ?? 0),
    Number(position?.Y?.Offset ?? 0),
    Number((anchorPoint as { X?: number; x?: number } | undefined)?.X ?? (anchorPoint as { x?: number } | undefined)?.x ?? 0),
    Number((anchorPoint as { Y?: number; y?: number } | undefined)?.Y ?? (anchorPoint as { y?: number } | undefined)?.y ?? 0),
  ];

  return dimensions.every((value) => Number.isFinite(value));
}

function useViewportRect() {
  const [rect, setRect] = React.useState<LayoutRect>(() => ({
    x: 0,
    y: 0,
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  React.useEffect(() => {
    const update = () => {
      setRect({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return rect;
}

function useWasmLayoutRect(params: {
  host: HostName;
  parentRect: LayoutRect | null;
  size: UDim2Value | undefined;
  position: UDim2Value | undefined;
  anchorPoint: Vector2Like | undefined;
}) {
  const [rect, setRect] = React.useState<LayoutRect | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    if (!params.parentRect || !params.size) {
      setRect(null);
      return () => {
        cancelled = true;
      };
    }

    if (!hasFiniteLayoutValues(params.size, params.position, params.anchorPoint)) {
      setRect(null);
      return () => {
        cancelled = true;
      };
    }

    void computeNodeRectWithWasm({
      nodeType: hostToNodeType(params.host),
      size: toSolverUDim2(params.size),
      position: toSolverUDim2(params.position),
      anchorPoint: toSolverVector2(params.anchorPoint),
      parentRect: params.parentRect,
    })
      .then((nextRect) => {
        if (!cancelled) {
          setRect(nextRect);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRect(null);
          if (typeof console !== "undefined") {
            console.warn("Failed to compute preview layout with Wasm:", error);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    params.anchorPoint,
    params.host,
    params.parentRect?.height,
    params.parentRect?.width,
    params.parentRect?.x,
    params.parentRect?.y,
    params.position,
    params.size,
  ]);

  return rect;
}

function getLayoutInput(props: PreviewDomProps) {
  return {
    size: props.Size as UDim2Value | undefined,
    position: props.Position as UDim2Value | undefined,
    anchorPoint: props.AnchorPoint as Vector2Like | undefined,
  };
}

function withLayoutContext(children: React.ReactNode, rect: LayoutRect | null) {
  if (!rect) {
    return children;
  }

  return <LayoutRectContext.Provider value={rect}>{children}</LayoutRectContext.Provider>;
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
    Image,
    Modal,
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

  void AnchorPoint;
  void AutoButtonColor;
  void Modal;
  void TextTransparency;

  const forwarded = pickForwardedDomProps(rest);
  const computedStyle: React.CSSProperties = {
    ...(style ?? {}),
  };

  if (Visible === false) {
    computedStyle.display = "none";
  }

  if (Size) {
    computedStyle.width = toCssLength(Size.X);
    computedStyle.height = toCssLength(Size.Y);
  }

  if (Position) {
    computedStyle.position = "absolute";
    computedStyle.left = toCssLength(Position.X);
    computedStyle.top = toCssLength(Position.Y);
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
    computedStyle.textAlign = toTextAlign(TextXAlignment);
    computedStyle.justifyContent = toJustifyContent(TextYAlignment);
    computedStyle.display = computedStyle.display === "none" ? "none" : "flex";
    computedStyle.flexDirection = "column";
  }

  if (options.host === "imagelabel") {
    computedStyle.objectFit = "cover";
  }

  if (options.host === "scrollingframe") {
    computedStyle.overflow = "auto";
  }

  if (options.host === "screengui" && computedStyle.position === undefined) {
    computedStyle.position = "fixed";
    computedStyle.inset = 0;
  }

  if (options.wasmRect && options.parentRect) {
    const localX = options.wasmRect.x - options.parentRect.x;
    const localY = options.wasmRect.y - options.parentRect.y;

    computedStyle.position = options.host === "screengui" ? "fixed" : "absolute";
    computedStyle.left = `${localX}px`;
    computedStyle.top = `${localY}px`;
    computedStyle.width = `${options.wasmRect.width}px`;
    computedStyle.height = `${options.wasmRect.height}px`;

    if (options.host === "screengui") {
      computedStyle.inset = undefined;
    }
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
    domProps: {
      ...forwarded,
      className: [`preview-host`, `preview-${options.host}`, className].filter(Boolean).join(" "),
      onBlur: mergedBlur,
      onChange: mergedChange,
      onClick: mergedClick,
      placeholder: PlaceholderText,
      style: computedStyle,
      tabIndex: Selectable === false ? -1 : (forwarded.tabIndex as number | undefined),
      "data-preview-host": options.host,
    },
    children,
    disabled: options.host === "textbutton" ? Active === false : TextEditable === false,
    image: Image,
    text: Text,
  };
}

function createDecoratorHost(displayName: string, host: HostName) {
  const Component = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
    const parentRect = React.useContext(LayoutRectContext);
    const layoutInput = getLayoutInput(props);
    const wasmRect = useWasmLayoutRect({
      host,
      parentRect,
      ...layoutInput,
    });
    const resolved = resolvePreviewDomProps(props, {
      host,
      parentRect,
      wasmRect,
    });

    return <span {...resolved.domProps} aria-hidden="true" ref={forwardedRef as React.Ref<HTMLSpanElement>} />;
  });
  Component.displayName = displayName;
  return Component;
}

export const Frame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const parentRect = React.useContext(LayoutRectContext);
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "frame",
    parentRect,
    ...layoutInput,
  });
  const resolved = resolvePreviewDomProps(props, {
    host: "frame",
    parentRect,
    wasmRect,
  });
  const nextRect = wasmRect ?? parentRect;

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.text ? <span className="preview-host-text">{resolved.text}</span> : undefined}
      {withLayoutContext(resolved.children, nextRect)}
    </div>
  );
});
Frame.displayName = "PreviewFrame";

export const TextButton = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const parentRect = React.useContext(LayoutRectContext);
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "textbutton",
    parentRect,
    ...layoutInput,
  });
  const resolved = resolvePreviewDomProps(props, {
    host: "textbutton",
    parentRect,
    wasmRect,
  });
  const nextRect = wasmRect ?? parentRect;

  return (
    <button
      {...resolved.domProps}
      disabled={resolved.disabled}
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
      type="button"
    >
      {resolved.text ? <span className="preview-host-text">{resolved.text}</span> : undefined}
      {withLayoutContext(resolved.children, nextRect)}
    </button>
  );
});
TextButton.displayName = "PreviewTextButton";

export const ScreenGui = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const viewportRect = useViewportRect();
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "screengui",
    parentRect: viewportRect,
    ...layoutInput,
  });
  const effectiveRect = wasmRect ?? viewportRect;
  const resolved = resolvePreviewDomProps(props, {
    host: "screengui",
    parentRect: viewportRect,
    wasmRect: effectiveRect,
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {withLayoutContext(resolved.children, effectiveRect)}
    </div>
  );
});
ScreenGui.displayName = "PreviewScreenGui";

export const TextLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const parentRect = React.useContext(LayoutRectContext);
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "textlabel",
    parentRect,
    ...layoutInput,
  });
  const resolved = resolvePreviewDomProps(props, {
    host: "textlabel",
    parentRect,
    wasmRect,
  });
  const nextRect = wasmRect ?? parentRect;

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.text}
      {withLayoutContext(resolved.children, nextRect)}
    </div>
  );
});
TextLabel.displayName = "PreviewTextLabel";

export const TextBox = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const parentRect = React.useContext(LayoutRectContext);
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "textbox",
    parentRect,
    ...layoutInput,
  });
  const resolved = resolvePreviewDomProps(props, {
    host: "textbox",
    parentRect,
    wasmRect,
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
  const parentRect = React.useContext(LayoutRectContext);
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "imagelabel",
    parentRect,
    ...layoutInput,
  });
  const resolved = resolvePreviewDomProps(props, {
    host: "imagelabel",
    parentRect,
    wasmRect,
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
  const parentRect = React.useContext(LayoutRectContext);
  const layoutInput = getLayoutInput(props);
  const wasmRect = useWasmLayoutRect({
    host: "scrollingframe",
    parentRect,
    ...layoutInput,
  });
  const resolved = resolvePreviewDomProps(props, {
    host: "scrollingframe",
    parentRect,
    wasmRect,
  });
  const nextRect = wasmRect ?? parentRect;

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {withLayoutContext(resolved.children, nextRect)}
    </div>
  );
});
ScrollingFrame.displayName = "PreviewScrollingFrame";

export const UICorner = createDecoratorHost("PreviewUICorner", "uicorner");
export const UIPadding = createDecoratorHost("PreviewUIPadding", "uipadding");
export const UIListLayout = createDecoratorHost("PreviewUIListLayout", "uilistlayout");
export const UIGridLayout = createDecoratorHost("PreviewUIGridLayout", "uigridlayout");
export const UIStroke = createDecoratorHost("PreviewUIStroke", "uistroke");

