import { React } from "@lattice-ui/core";
import { PreviewTargetShell } from "./PreviewTargetShell";

type DocExampleShellProps = {
  /** Fixed pixel size of the centered example stage. */
  width: number;
  height: number;
  children: React.ReactNode;
};

/**
 * Shell for docs-embedded examples: providers from PreviewTargetShell plus a
 * fixed-size stage centered in the viewport, so an example reads like a real
 * usage snippet instead of a full-bleed test scene.
 */
export function DocExampleShell(props: DocExampleShellProps) {
  return (
    <PreviewTargetShell>
      <frame BackgroundTransparency={1} Size={UDim2.fromScale(1, 1)}>
        <frame
          AnchorPoint={new Vector2(0.5, 0.5)}
          BackgroundTransparency={1}
          Position={UDim2.fromScale(0.5, 0.5)}
          Size={UDim2.fromOffset(props.width, props.height)}
        >
          {props.children}
        </frame>
      </frame>
    </PreviewTargetShell>
  );
}
