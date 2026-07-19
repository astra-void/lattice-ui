import {
  motionSettle,
  motionTargets as motionTargetContracts,
  type ResponseMotionConfig,
  useResponseMotion,
} from "@lattice-ui/react-motion";
import { composeRefs, getElementRef, getPassthroughProps, React } from "@lattice-ui/react-runtime";
import { useSwitchContext } from "./context";
import type { SwitchThumbProps } from "./types";

const OWN_PROPS = ["asChild", "children"] as const;

// See SwitchRoot: only the Roblox instance defaults are neutralized, never appearance.
const NEUTRAL_PROPS = {
  BackgroundTransparency: 1,
  BorderSizePixel: 0,
};

/**
 * Checked parks the thumb's trailing edge on the track's trailing edge, unchecked its leading edge
 * on the leading edge. `AnchorPoint` and `Position` interpolate together, so the travel resolves to
 * `t * (trackWidth - thumbWidth)` for any thumb width — the primitive never has to know how wide
 * the consumer made it.
 */
const CHECKED_THUMB_GEOMETRY = {
  AnchorPoint: new Vector2(1, 0),
  Position: UDim2.fromScale(1, 0),
};

const UNCHECKED_THUMB_GEOMETRY = {
  AnchorPoint: new Vector2(0, 0),
  Position: UDim2.fromScale(0, 0),
};

type GuiPropBag = React.Attributes & Record<string, unknown>;

function toGuiPropBag(value: unknown): GuiPropBag {
  return typeIs(value, "table") ? (value as GuiPropBag) : {};
}

function toUDim2(value: unknown) {
  return typeIs(value, "UDim2") ? value : undefined;
}

export function SwitchThumb(props: SwitchThumbProps) {
  const switchContext = useSwitchContext();
  const passthrough = getPassthroughProps<Frame>(props, OWN_PROPS);
  // Motion owns the thumb's placement under the `layout` contract, so these are dropped rather than
  // written and then silently clobbered on the next frame.
  passthrough.AnchorPoint = undefined;
  passthrough.Position = undefined;

  const child = props.children;
  const childProps =
    props.asChild && React.isValidElement(child) ? toGuiPropBag((child as { props?: unknown }).props) : undefined;
  // The wrapper is an extra layer between the track and the consumer's element, so it has to match
  // the size the consumer declared; otherwise the child would hang off the edge the wrapper anchors
  // to. This informs nothing about the travel distance.
  const declaredSize = toUDim2(passthrough.Size) ?? toUDim2(childProps?.Size);

  const motionTargets = React.useMemo(
    () => ({
      active: CHECKED_THUMB_GEOMETRY,
      inactive: UNCHECKED_THUMB_GEOMETRY,
    }),
    [],
  );
  const motionConfig = React.useMemo<ResponseMotionConfig>(
    () => ({
      target: motionTargetContracts.layout("switch thumb response"),
      settle: { duration: motionSettle.toggle, tempo: "swift", tone: "responsive" },
    }),
    [],
  );

  const motionRef = useResponseMotion<Frame>(switchContext.checked, motionTargets, motionConfig);
  const ref = composeRefs<Frame>(passthrough.ref as never, motionRef);

  if (props.asChild) {
    if (!React.isValidElement(child)) {
      error("[SwitchThumb] `asChild` requires a child element.");
    }

    const resolvedChildProps = childProps ?? {};
    const childRef = getElementRef<Instance>(child);

    // Motion owns its own host element: the animated `Position` lands on this wrapper, never on the
    // consumer's element, which is pinned inside it.
    return (
      <frame {...NEUTRAL_PROPS} {...passthrough} Size={declaredSize} ref={ref}>
        {React.cloneElement(child as React.ReactElement<GuiPropBag>, {
          ...resolvedChildProps,
          Position: UDim2.fromOffset(0, 0),
          ref: composeRefs(childRef),
        })}
      </frame>
    );
  }

  return (
    <frame {...NEUTRAL_PROPS} {...passthrough} ref={ref}>
      {props.children}
    </frame>
  );
}
