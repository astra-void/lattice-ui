import * as React from "react";
import {
  FULL_SIZE_UDIM2,
  normalizePreviewNodeId,
  type SerializedUDim2,
  type SerializedVector2,
  serializeUDim2,
  serializeVector2,
  ZERO_UDIM2,
} from "../internal/robloxValues";
import { LayoutNodeParentProvider, useLayoutDebugState, useRobloxLayout } from "../layout/context";
import { type ComputedRect } from "../layout/model";
import { type LayoutHostName, layoutHostNodeType, type PreviewDomProps } from "./types";

type LayoutInput = {
  anchorPoint: SerializedVector2;
  id?: string;
  parentId?: string;
  position: SerializedUDim2;
  size?: SerializedUDim2;
};

let previewNodeIdCounter = 0;

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getDefaultSize(host: LayoutHostName): SerializedUDim2 | undefined {
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
    parentId: getStringValue(source.ParentId ?? source.parentId),
    position: serializeUDim2(source.Position ?? source.position, ZERO_UDIM2) ?? ZERO_UDIM2,
    size: serializeUDim2(source.Size ?? source.size, getDefaultSize(host)),
  };
}

function useGeneratedPreviewNodeId(): string {
  const idRef = React.useRef<string | null>(null);
  if (idRef.current === null) {
    previewNodeIdCounter += 1;
    idRef.current = `preview-node-${previewNodeIdCounter}`;
  }

  return idRef.current;
}

function resolveNodeId(generatedId: string, layoutInput: LayoutInput): string {
  return normalizePreviewNodeId(layoutInput.id) ?? generatedId;
}

type LayoutDebugState = ReturnType<typeof useLayoutDebugState>;

function toDebugAttributeValue(
  value: React.CSSProperties[keyof React.CSSProperties] | number | string | undefined | null,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

export function withLayoutDiagnostics(
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

export function useHostLayout(host: LayoutHostName, props: PreviewDomProps) {
  const generatedId = useGeneratedPreviewNodeId();
  const layoutInput = React.useMemo(() => getLayoutInput(host, props), [host, props]);
  const normalizedParentId = React.useMemo(() => normalizePreviewNodeId(layoutInput.parentId), [layoutInput.parentId]);

  const nodeId = React.useMemo(() => resolveNodeId(generatedId, layoutInput), [generatedId, layoutInput]);

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

export function withNodeParent(nodeId: string, rect: ComputedRect | null, children: React.ReactNode) {
  return (
    <LayoutNodeParentProvider nodeId={nodeId} rect={rect}>
      {children}
    </LayoutNodeParentProvider>
  );
}
