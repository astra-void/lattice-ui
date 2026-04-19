const GuiService = game.GetService("GuiService");

type OutsidePointerOptions = {
  layerIgnoresGuiInset: boolean;
  insideRoots?: Array<GuiObject | undefined>;
};

function addUniqueSample(samples: Array<Vector2>, sampleKeys: Record<string, true>, x: number, y: number) {
  const roundedX = math.round(x);
  const roundedY = math.round(y);
  const key = `${roundedX}:${roundedY}`;
  if (sampleKeys[key]) {
    return;
  }

  sampleKeys[key] = true;
  samples.push(new Vector2(roundedX, roundedY));
}

function getGuiInsetTopLeft() {
  const [topLeftInset] = GuiService.GetGuiInset();
  return topLeftInset;
}

function getPointerSamples(pointerPosition: Vector2, options: OutsidePointerOptions) {
  const insetTopLeft = getGuiInsetTopLeft();

  const samples: Vector2[] = [];
  const sampleKeys: Record<string, true> = {};

  addUniqueSample(samples, sampleKeys, pointerPosition.X, pointerPosition.Y);
  addUniqueSample(samples, sampleKeys, pointerPosition.X + insetTopLeft.X, pointerPosition.Y + insetTopLeft.Y);
  addUniqueSample(samples, sampleKeys, pointerPosition.X - insetTopLeft.X, pointerPosition.Y - insetTopLeft.Y);

  if (options.layerIgnoresGuiInset) {
    addUniqueSample(samples, sampleKeys, pointerPosition.X, pointerPosition.Y + insetTopLeft.Y);
    addUniqueSample(samples, sampleKeys, pointerPosition.X, pointerPosition.Y - insetTopLeft.Y);
    addUniqueSample(samples, sampleKeys, pointerPosition.X + insetTopLeft.X, pointerPosition.Y);
    addUniqueSample(samples, sampleKeys, pointerPosition.X - insetTopLeft.X, pointerPosition.Y);
  }

  return samples;
}

function isWithinInsideRoots(hitObject: GuiObject, insideRoots: Array<GuiObject | undefined>) {
  for (const insideRoot of insideRoots) {
    if (!insideRoot) {
      continue;
    }

    if (hitObject === insideRoot || hitObject.IsDescendantOf(insideRoot)) {
      return true;
    }
  }

  return false;
}

function isWithinContentBoundary(hitObject: GuiObject, contentWrapper: GuiObject) {
  return hitObject === contentWrapper || hitObject.IsDescendantOf(contentWrapper);
}

export function isOutsidePointerEvent(
  inputObject: InputObject,
  container: BasePlayerGui,
  contentWrapper: GuiObject,
  options: OutsidePointerOptions,
) {
  const rawPointerPosition = inputObject.Position;
  const pointerPosition = new Vector2(rawPointerPosition.X, rawPointerPosition.Y);
  const pointerSamples = getPointerSamples(pointerPosition, options);
  const insideRoots = options.insideRoots ?? [];

  for (const sample of pointerSamples) {
    const hitGuiObjects = container.GetGuiObjectsAtPosition(sample.X, sample.Y);
    for (const hitObject of hitGuiObjects) {
      if (isWithinContentBoundary(hitObject, contentWrapper) || isWithinInsideRoots(hitObject, insideRoots)) {
        return false;
      }
    }
  }

  return true;
}
