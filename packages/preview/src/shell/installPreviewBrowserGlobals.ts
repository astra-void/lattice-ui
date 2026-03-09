import robloxMock from "../source/robloxEnv";
import { setupRobloxEnvironment } from "@lattice-ui/preview-runtime";

const robloxMockRecord = robloxMock as unknown as Record<PropertyKey, unknown>;

const previewGlobalFallbackMarker = Symbol.for("lattice.preview.browserGlobalsFallback");

function createMissingGlobalFallback(basePrototype: object | null) {
  return new Proxy(basePrototype ?? Object.prototype, {
    get(target, property) {
      if (property === previewGlobalFallbackMarker) {
        return true;
      }

      if (Reflect.has(target, property)) {
        return (target as Record<PropertyKey, unknown>)[property];
      }

      if (typeof property !== "string") {
        return undefined;
      }

      return robloxMockRecord[property];
    },
    has(target, property) {
      if (typeof property === "string") {
        return true;
      }

      return Reflect.has(target, property);
    },
  });
}

function installMissingGlobalFallback(target: object) {
  const prototypeHost: unknown = Object.getPrototypeOf(target);
  if (!prototypeHost || (typeof prototypeHost !== "object" && typeof prototypeHost !== "function")) {
    return;
  }

  const currentFallback = Object.getPrototypeOf(prototypeHost) as Record<PropertyKey, unknown> | null;
  if (currentFallback?.[previewGlobalFallbackMarker] === true) {
    return;
  }

  try {
    Object.setPrototypeOf(prototypeHost, createMissingGlobalFallback(currentFallback));
  } catch {
    // Ignore environments that do not allow prototype mutation on the global host.
  }
}

export function installPreviewBrowserGlobals() {
  setupRobloxEnvironment();
  installMissingGlobalFallback(globalThis as object);

  if (typeof window !== "undefined") {
    installMissingGlobalFallback(window);
  }
}
