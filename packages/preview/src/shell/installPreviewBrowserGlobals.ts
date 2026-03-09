import robloxMock from "../source/robloxEnv";

const robloxMockRecord = robloxMock as unknown as Record<PropertyKey, unknown>;

const previewGlobalFallbackMarker = Symbol.for("lattice.preview.browserGlobalsFallback");

type PreviewGlobalRecord = typeof globalThis & {
  Enum?: unknown;
};

type PreviewWindow = Window & {
  Enum?: unknown;
};

type MockEnumItem = {
  EnumType: {
    Name: string;
  };
  IsA: (name: string) => boolean;
  Name: string;
  Value: number;
  [Symbol.toPrimitive]: (hint: string) => number | string;
  toString: () => string;
  valueOf: () => number;
};

function createEnumItem(enumName: string, itemName: string, value = 0): MockEnumItem {
  const text = `${enumName}.${itemName}`;

  return {
    EnumType: {
      Name: enumName,
    },
    IsA: (name) => name === enumName || name === itemName,
    Name: itemName,
    Value: value,
    [Symbol.toPrimitive]: (hint) => (hint === "number" ? value : text),
    toString: () => text,
    valueOf: () => value,
  };
}

function createEnumCategory(enumName: string) {
  return new Proxy(
    {},
    {
      get: (_target, property) => {
        if (property === Symbol.toStringTag) {
          return "Enum";
        }

        if (property === "GetEnumItems") {
          return () => [];
        }

        if (property === "FromName") {
          return (itemName: string) => createEnumItem(enumName, String(itemName));
        }

        if (property === "FromValue") {
          return (value: number) => createEnumItem(enumName, `Value${value}`, Number.isFinite(value) ? value : 0);
        }

        if (property === "Name") {
          return enumName;
        }

        return createEnumItem(enumName, String(property));
      },
    },
  );
}

function createEnumRoot() {
  return new Proxy(
    {},
    {
      get: (_target, property) => {
        if (property === Symbol.toStringTag) {
          return "Enum";
        }

        if (property === "GetEnums") {
          return () => [];
        }

        return createEnumCategory(String(property));
      },
    },
  );
}

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
  const globalRecord = globalThis as PreviewGlobalRecord;
  installMissingGlobalFallback(globalThis as object);

  if (globalRecord.Enum === undefined) {
    globalRecord.Enum = createEnumRoot();
  }

  if (typeof window !== "undefined") {
    installMissingGlobalFallback(window);
    (window as PreviewWindow).Enum = globalRecord.Enum;
  }
}
