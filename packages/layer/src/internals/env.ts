export const UserInputService = game.GetService("UserInputService");
export const GuiService = game.GetService("GuiService");
export const ContextActionService = game.GetService("ContextActionService");

export function getGuiInsetTopLeft() {
  const [topLeftInset] = GuiService.GetGuiInset();
  return topLeftInset;
}
