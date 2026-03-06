import * as React from "react";
import type { Color3Value, UDim2Value } from "./helpers";
import { toCssColor, toCssLength } from "./helpers";

export type PreviewEventTable = {
  Activated?: (event: Event) => void;
  FocusLost?: (event: Event) => void;
};

type ForwardedDomProps = React.HTMLAttributes<HTMLElement> &
  React.InputHTMLAttributes<HTMLInputElement> &
  React.ImgHTMLAttributes<HTMLImageElement>;

export type PreviewDomProps = {
  Active?: boolean;
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
  host:
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
};

export function resolvePreviewDomProps(props: PreviewDomProps, options: ResolveOptions) {
  const {
    Active,
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

function createDecoratorHost(displayName: string, host: ResolveOptions["host"]) {
  const Component = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
    const resolved = resolvePreviewDomProps(props, { host });

    return <span {...resolved.domProps} aria-hidden="true" ref={forwardedRef as React.Ref<HTMLSpanElement>} />;
  });
  Component.displayName = displayName;
  return Component;
}

export const Frame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const resolved = resolvePreviewDomProps(props, {
    host: "frame",
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.text ? <span className="preview-host-text">{resolved.text}</span> : undefined}
      {resolved.children}
    </div>
  );
});
Frame.displayName = "PreviewFrame";

export const TextButton = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const resolved = resolvePreviewDomProps(props, {
    host: "textbutton",
  });

  return (
    <button
      {...resolved.domProps}
      disabled={resolved.disabled}
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
      type="button"
    >
      {resolved.text ? <span className="preview-host-text">{resolved.text}</span> : undefined}
      {resolved.children}
    </button>
  );
});
TextButton.displayName = "PreviewTextButton";

export const ScreenGui = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const resolved = resolvePreviewDomProps(props, {
    host: "screengui",
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.children}
    </div>
  );
});
ScreenGui.displayName = "PreviewScreenGui";

export const TextLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const resolved = resolvePreviewDomProps(props, {
    host: "textlabel",
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.text}
      {resolved.children}
    </div>
  );
});
TextLabel.displayName = "PreviewTextLabel";

export const TextBox = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const resolved = resolvePreviewDomProps(props, {
    host: "textbox",
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
  const resolved = resolvePreviewDomProps(props, {
    host: "imagelabel",
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
  const resolved = resolvePreviewDomProps(props, {
    host: "scrollingframe",
  });

  return (
    <div {...resolved.domProps} ref={forwardedRef as React.Ref<HTMLDivElement>}>
      {resolved.children}
    </div>
  );
});
ScrollingFrame.displayName = "PreviewScrollingFrame";

export const UICorner = createDecoratorHost("PreviewUICorner", "uicorner");
export const UIPadding = createDecoratorHost("PreviewUIPadding", "uipadding");
export const UIListLayout = createDecoratorHost("PreviewUIListLayout", "uilistlayout");
export const UIGridLayout = createDecoratorHost("PreviewUIGridLayout", "uigridlayout");
export const UIStroke = createDecoratorHost("PreviewUIStroke", "uistroke");
