const PREFIX = "@lattice-ui/preview-runtime";

export function reportPreviewRuntimeError(scope: string, error: unknown) {
  console.error(`${PREFIX}:${scope}`, error);
}
