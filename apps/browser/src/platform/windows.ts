export {
  openWindow,
  closeWindow,
  focusWindow,
  animateWindowClose,
  restoreFullScreen,
  setWindowTitle,
  setWindowActivity,
  setTrafficLightsCenter,
  watchLeftEdge,
  raiseView,
  windowFrame,
  windowIds,
  onWindowEvent,
  dragPreview,
  type DragPreviewShape,
  type WindowEvent,
  type OpenWindowOptions,
} from "@ardia/shell";
import { call } from "@ardia/ardiacore";

export const chromeWindows = () => call("windows.list");
export const devWindowAction = (windowNumber: number, action: string) => call("windows.dev", { window: windowNumber, action });
