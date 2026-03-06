declare module "@vitejs/plugin-react" {
  import type { PluginOption } from "vite";

  export default function reactPlugin(options?: unknown): PluginOption[];
}
