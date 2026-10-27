import { menuShown, watchMenus } from "../../platform/menus";
import { useBrowser } from "../browser/store";
import { activeTabId } from "../browser/model";
import { pointerOnCard } from "../sidebar/hover";
import { sidebarUi, useSidebarUi } from "../sidebar/sidebarUi";
import { useHistoryMenu } from "../tabs/navigation";
import { usePages } from "../tabs/pageState";
import { addressBarInSidebar } from "../windows/layout";

export function peekHeld(windowId: string): boolean {
  if (menuShown()) return true;
  const ui = sidebarUi();
  if (ui.renaming?.windowId === windowId || ui.iconPicker?.windowId === windowId) return true;
  if (ui.hover?.windowId === windowId && pointerOnCard()) return true;
  const s = useBrowser.getState();
  if (s.windowUi[windowId]?.downloadsOpen) return true;
  const tabId = addressBarInSidebar(s, windowId) ? activeTabId(s, windowId) : undefined;
  return !!tabId && (!!usePages.getState().popover[tabId] || useHistoryMenu.getState().menu?.tabId === tabId);
}

export function watchPeekHolds(changed: () => void): () => void {
  const stops = [watchMenus(changed), useSidebarUi.subscribe(changed), useBrowser.subscribe(changed), usePages.subscribe(changed), useHistoryMenu.subscribe(changed)];
  return () => stops.forEach((stop) => stop());
}
