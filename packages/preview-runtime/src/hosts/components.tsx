import * as React from "react";
import { type ComputedRect } from "../layout/model";
import { useTextScaleStyle } from "../style/textStyles";
import { applyHoistedModifierStyles, extractHoistedChildren } from "./modifiers";
import { type ResolvedPreviewDomProps, resolvePreviewDomProps } from "./resolveProps";
import { type PreviewDomProps } from "./types";
import { useHostLayout, withLayoutDiagnostics, withNodeParent } from "./useHostLayout";

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
  resolved: ResolvedPreviewDomProps,
  computed: ComputedRect | null,
): ResolvedPreviewDomProps {
  const { children, state } = extractHoistedChildren(resolved.children, computed);
  const domStyle = {
    ...(resolved.domProps.style as React.CSSProperties | undefined),
  };

  applyHoistedModifierStyles(domStyle, state, props.AnchorPoint);

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

export const Frame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("frame", props);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLDivElement>, elementRef as React.Ref<HTMLDivElement>);
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
      ref={mergedRef}
    >
      {renderHostText(prepared.text)}
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
Frame.displayName = "PreviewFrame";

export const TextButton = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("textbutton", props);
  const innerRef = elementRef as React.RefObject<HTMLButtonElement | null>;
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLButtonElement>, innerRef as React.Ref<HTMLButtonElement>);
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
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("screengui", props);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLDivElement>, elementRef as React.Ref<HTMLDivElement>);
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
      ref={mergedRef}
    >
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
ScreenGui.displayName = "PreviewScreenGui";

export const TextLabel = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("textlabel", props);
  const innerRef = elementRef as React.RefObject<HTMLDivElement | null>;
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLDivElement>, innerRef as React.Ref<HTMLDivElement>);
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
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("textbox", props);
  const innerRef = elementRef as React.RefObject<HTMLInputElement | null>;
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLInputElement>, innerRef as React.Ref<HTMLInputElement>);
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
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("imagelabel", props);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLImageElement>, elementRef as React.Ref<HTMLImageElement>);
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
      ref={mergedRef}
      src={typeof prepared.image === "string" ? prepared.image : undefined}
    />
  );
});
ImageLabel.displayName = "PreviewImageLabel";

export const ScrollingFrame = React.forwardRef<HTMLElement, PreviewDomProps>((props, forwardedRef) => {
  const { computed, diagnostics, elementRef, nodeId } = useHostLayout("scrollingframe", props);
  const mergedRef = useMergedRefs(forwardedRef as React.Ref<HTMLDivElement>, elementRef as React.Ref<HTMLDivElement>);
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
      ref={mergedRef}
    >
      {withNodeParent(nodeId, computed, prepared.children)}
    </div>
  );
});
ScrollingFrame.displayName = "PreviewScrollingFrame";
