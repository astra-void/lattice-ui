type LuauMath = {
  floor: (value: number) => number;
  clamp: (value: number, min: number, max: number) => number;
  max: (...values: number[]) => number;
  min: (...values: number[]) => number;
  round: (value: number) => number;
};

class MockVector2 {
  public X: number;
  public Y: number;

  constructor(x: number, y: number) {
    this.X = x;
    this.Y = y;
  }
}

class MockUDim2 {
  public X: { Scale: number; Offset: number };
  public Y: { Scale: number; Offset: number };

  constructor(xScale: number, xOffset: number, yScale: number, yOffset: number) {
    this.X = { Scale: xScale, Offset: xOffset };
    this.Y = { Scale: yScale, Offset: yOffset };
  }

  static fromOffset(x: number, y: number) {
    return new MockUDim2(0, x, 0, y);
  }

  static fromScale(x: number, y: number) {
    return new MockUDim2(x, 0, y, 0);
  }

  add(other: MockUDim2) {
    return new MockUDim2(
      this.X.Scale + other.X.Scale,
      this.X.Offset + other.X.Offset,
      this.Y.Scale + other.Y.Scale,
      this.Y.Offset + other.Y.Offset,
    );
  }

  sub(other: MockUDim2) {
    return new MockUDim2(
      this.X.Scale - other.X.Scale,
      this.X.Offset - other.X.Offset,
      this.Y.Scale - other.Y.Scale,
      this.Y.Offset - other.Y.Offset,
    );
  }
}

const luauMath: LuauMath = {
  floor(value) {
    return Math.floor(value);
  },
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  max(...values) {
    return Math.max(...values);
  },
  min(...values) {
    return Math.min(...values);
  },
  round(value) {
    return Math.round(value);
  },
};

const luauString = {
  lower(value: string) {
    return value.toLowerCase();
  },
  find(value: string, query: string, init = 1) {
    const start = Math.max(0, init - 1);
    const index = value.indexOf(query, start);
    return index >= 0 ? index + 1 : undefined;
  },
};

type TypeName = "string" | "number" | "boolean" | "function" | "table";
function typeIs(value: unknown, typeName: TypeName) {
  if (typeName === "table") {
    return typeof value === "object" && value !== null;
  }

  return typeof value === typeName;
}

function* ipairs<T>(value: Array<T>) {
  for (let index = 0; index < value.length; index++) {
    yield [index + 1, value[index]] as const;
  }
}

function* pairs<T extends Record<string, unknown>>(value: T) {
  for (const key of Object.keys(value)) {
    yield [key, value[key]] as const;
  }
}

const arrayProto = Array.prototype as unknown as { size?: () => number };
if (arrayProto.size === undefined) {
  Object.defineProperty(arrayProto, "size", {
    value() {
      return (this as Array<unknown>).length;
    },
    configurable: true,
    writable: true,
  });
}

const removableArrayProto = Array.prototype as unknown as { remove?: (index: number) => unknown };
if (removableArrayProto.remove === undefined) {
  Object.defineProperty(removableArrayProto, "remove", {
    value(index: number) {
      return (this as Array<unknown>).splice(index, 1)[0];
    },
    configurable: true,
    writable: true,
  });
}

const stringProto = String.prototype as unknown as { size?: () => number };
if (stringProto.size === undefined) {
  Object.defineProperty(stringProto, "size", {
    value() {
      return (this as string).length;
    },
    configurable: true,
    writable: true,
  });
}

Object.assign(globalThis as Record<string, unknown>, {
  ipairs,
  pairs,
  math: luauMath,
  string: luauString,
  typeIs,
  Vector2: MockVector2,
  UDim2: MockUDim2,
});

// Popover testing shim for game
if (!globalThis.game) {
  const mockWorkspace = { GetPropertyChangedSignal: () => ({ Connect: () => ({ Disconnect: () => {} }) }),
    CurrentCamera: { ViewportSize: new MockVector2(1920, 1080), GetPropertyChangedSignal: () => ({ Connect: () => ({ Disconnect: () => {} }) }) }
  };
  const mockRunService = {
    Heartbeat: { Connect: () => ({ Disconnect: () => {} }) }
  };
  globalThis.game = {
    GetService: (service: string) => {
      if (service === "Workspace") return mockWorkspace;
      if (service === "RunService") return mockRunService;
      return {};
    }
  };
}

if (!globalThis.Enum) {
  globalThis.Enum = {
    EasingStyle: { Quad: "Quad" },
    EasingDirection: { Out: "Out", In: "In" },
    TextXAlignment: { Left: "Left" },
    TextYAlignment: { Top: "Top" },
  };
  globalThis.TweenInfo = function() {};
  globalThis.Color3 = { fromRGB: () => ({}) };
  globalThis.UDim = function() {};
  globalThis.Instance = { new: () => ({}) };
}

class MockRect {
  public Min: any;
  public Max: any;
  public Width: number;
  public Height: number;

  constructor(minX: any, minY: any, maxX: any, maxY: any) {
    if (typeof minX === 'number') {
      this.Min = new MockVector2(minX, minY);
      this.Max = new MockVector2(maxX, maxY);
    } else {
      this.Min = minX;
      this.Max = minY;
    }
    this.Width = this.Max.X - this.Min.X;
    this.Height = this.Max.Y - this.Min.Y;
  }
}

Object.assign(globalThis, { Rect: MockRect });
