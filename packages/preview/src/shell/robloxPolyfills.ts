const previewRobloxPolyfillsMarker = Symbol.for("lattice.preview.robloxPolyfillsInstalled");

type CallableSize = (() => number) & {
  [Symbol.toPrimitive]: (hint: string) => number | string;
  toString: () => string;
  valueOf: () => number;
};

type PreviewPolyfillGlobal = typeof globalThis & {
  [previewRobloxPolyfillsMarker]?: boolean;
  print?: (...args: unknown[]) => void;
};

declare global {
  interface String {
    size(): number;
    lower(): string;
    upper(): string;
    sub(start?: number, finish?: number): string;
  }

  interface Array<T> {
    size(): number;
    isEmpty(): boolean;
  }

  interface ReadonlyArray<T> {
    size(): number;
    isEmpty(): boolean;
  }
}

function definePrototypeMethod<TPrototype extends object>(
  prototype: TPrototype,
  property: PropertyKey,
  value: (...args: never[]) => unknown,
) {
  Object.defineProperty(prototype, property, {
    configurable: true,
    enumerable: false,
    value,
    writable: true,
  });
}

function normalizeLuaIndex(length: number, index: number | undefined, fallback: number) {
  const resolvedIndex = index == null || !Number.isFinite(index) ? fallback : Math.trunc(index);

  if (resolvedIndex === 0) {
    return 1;
  }

  if (resolvedIndex < 0) {
    return length + resolvedIndex + 1;
  }

  return resolvedIndex;
}

function luaSubstring(value: string, start?: number, finish?: number) {
  if (value.length === 0) {
    return "";
  }

  const normalizedStart = Math.max(1, Math.min(value.length + 1, normalizeLuaIndex(value.length, start, 1)));
  const normalizedFinish = Math.max(0, Math.min(value.length, normalizeLuaIndex(value.length, finish, value.length)));

  if (normalizedStart > normalizedFinish) {
    return "";
  }

  return value.slice(normalizedStart - 1, normalizedFinish);
}

function createCallableSize(readSize: () => number): CallableSize {
  const callable = (() => readSize()) as CallableSize;
  callable.valueOf = () => readSize();
  callable.toString = () => String(readSize());
  callable[Symbol.toPrimitive] = (hint) => (hint === "string" ? String(readSize()) : readSize());
  return callable;
}

function installCollectionSizeShim(prototype: object) {
  const nativeSizeDescriptor = Object.getOwnPropertyDescriptor(prototype, "size");
  if (!nativeSizeDescriptor || typeof nativeSizeDescriptor.get !== "function") {
    return;
  }

  const nativeGetSize = nativeSizeDescriptor.get;
  const callableSizeCache = new WeakMap<object, CallableSize>();

  Object.defineProperty(prototype, "size", {
    configurable: true,
    enumerable: nativeSizeDescriptor.enumerable ?? false,
    get(this: object) {
      let callableSize = callableSizeCache.get(this);
      if (!callableSize) {
        callableSize = createCallableSize(() => Number(nativeGetSize.call(this)));
        callableSizeCache.set(this, callableSize);
      }

      return callableSize;
    },
  });
}

function installStringPolyfills() {
  definePrototypeMethod(String.prototype, "size", function size(this: string) {
    return String(this).length;
  });
  definePrototypeMethod(String.prototype, "lower", function lower(this: string) {
    return String(this).toLowerCase();
  });
  definePrototypeMethod(String.prototype, "upper", function upper(this: string) {
    return String(this).toUpperCase();
  });
  definePrototypeMethod(String.prototype, "sub", function sub(this: string, start?: number, finish?: number) {
    return luaSubstring(String(this), start, finish);
  });
}

function installArrayPolyfills() {
  definePrototypeMethod(Array.prototype, "size", function size<T>(this: Array<T>) {
    return this.length;
  });
  definePrototypeMethod(Array.prototype, "isEmpty", function isEmpty<T>(this: Array<T>) {
    return this.length === 0;
  });
}

function installPrintPolyfill(target: PreviewPolyfillGlobal) {
  target.print = (...args: unknown[]) => {
    console.log(...args);
  };

  if (typeof window !== "undefined") {
    window.print = (...args: unknown[]) => {
      console.log(...args);
    };
  }
}

export function installPreviewRobloxPolyfills(target: PreviewPolyfillGlobal = globalThis as PreviewPolyfillGlobal) {
  if (target[previewRobloxPolyfillsMarker]) {
    return;
  }

  installStringPolyfills();
  installArrayPolyfills();
  installPrintPolyfill(target);

  try {
    installCollectionSizeShim(Map.prototype);
    installCollectionSizeShim(Set.prototype);
  } catch {
    // Ignore environments that do not allow prototype descriptor overrides.
  }

  target[previewRobloxPolyfillsMarker] = true;
}

export default installPreviewRobloxPolyfills;
