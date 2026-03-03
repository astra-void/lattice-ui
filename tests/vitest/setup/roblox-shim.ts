type LuauMath = {
  clamp: (value: number, min: number, max: number) => number;
  max: (...values: number[]) => number;
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
}

const luauMath: LuauMath = {
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  max(...values) {
    return Math.max(...values);
  },
  round(value) {
    return Math.round(value);
  },
};

Object.assign(globalThis as Record<string, unknown>, {
  math: luauMath,
  Vector2: MockVector2,
  UDim2: MockUDim2,
});
