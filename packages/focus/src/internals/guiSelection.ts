import { GuiService } from "../FocusScope/focusManager";

export function getSelectedGuiObject() {
  return GuiService.SelectedObject;
}

export function setSelectedGuiObject(guiObject: GuiObject | undefined) {
  GuiService.SelectedObject = guiObject;
}
