export type PackageManagerName = "pnpm" | "npm" | "yarn";

export interface PackageManager {
  name: "pnpm" | "npm" | "yarn";
  add(dev: boolean, specs: string[], cwd: string): Promise<void>;
  remove(specs: string[], cwd: string): Promise<void>;
  install(cwd: string): Promise<void>;
  exec(bin: string, args: string[], cwd: string): Promise<void>;
}
