import { GuiService } from "../FocusScope/focusManager";

export const UserInputService = game.GetService("UserInputService");

export function getSelectedGuiObject() {
  return GuiService.SelectedObject;
}

export function setSelectedGuiObject(guiObject: GuiObject | undefined) {
  GuiService.SelectedObject = guiObject;
}
