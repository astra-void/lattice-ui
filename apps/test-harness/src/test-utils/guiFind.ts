export function findFirstDescendant(root: Instance, predicate: (instance: Instance) => boolean): Instance | undefined {
  if (predicate(root)) {
    return root;
  }

  for (const descendant of root.GetDescendants()) {
    if (predicate(descendant)) {
      return descendant;
    }
  }

  return undefined;
}

export function findGuiObjectByName(root: Instance, name: string) {
  const matched = findFirstDescendant(root, (instance) => instance.Name === name && instance.IsA("GuiObject"));
  if (!matched?.IsA("GuiObject")) {
    return undefined;
  }

  return matched;
}

export function findTextButtonByText(root: Instance, text: string) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("TextButton") && instance.Text === text);
  if (!matched?.IsA("TextButton")) {
    return undefined;
  }

  return matched;
}

export function findTextLabelByText(root: Instance, text: string) {
  const matched = findFirstDescendant(root, (instance) => instance.IsA("TextLabel") && instance.Text === text);
  if (!matched?.IsA("TextLabel")) {
    return undefined;
  }

  return matched;
}
