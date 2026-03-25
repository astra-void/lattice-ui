import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  projectName: "Lattice UI Loom Preview",
  workspaceRoot: __dirname,
  server: {
    port: 4175,
  },
  transformMode: "compatibility",
	targetDiscovery: {
		discoverTargets() {
			return [
				{
					name: "playground",
					packageName: "@lattice-ui/loom-preview",
					packageRoot: "./apps/loom-preview",
					sourceRoot: "./apps/loom-preview/src/preview-targets",
				},
				{
					name: "playground-client",
					packageName: "@lattice-ui/playground",
					packageRoot: "./apps/playground",
					sourceRoot: "./apps/playground/src/client",
				},
			];
		},
	},
};
