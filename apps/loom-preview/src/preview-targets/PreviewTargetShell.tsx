import { React } from "@lattice-ui/core";
import { SystemProvider } from "@lattice-ui/system";

type PreviewTargetShellProps = {
  children: React.ReactNode;
};

export function PreviewTargetShell(props: PreviewTargetShellProps) {
  return <SystemProvider defaultDensity="comfortable">{props.children}</SystemProvider>;
}
