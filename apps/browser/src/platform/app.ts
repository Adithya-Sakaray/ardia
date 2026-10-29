export {
  onAppEvent,
  onOpenURLs,
  replyToTerminate,
  setAppearance,
  isDarkAppearance,
  setThinScrollBars,
  systemInfo,
  updaterState,
  checkForUpdates,
  setAutomaticUpdateChecks,
  setAutomaticUpdateDownloads,
  setUpdateChannel,
  crashReports,
  devCrash,
  devSnapshotWindow,
  backgroundInstance,
  openExternalURL,
  appIcons,
  currentAppIcon,
  setAppIcon,
  isInDock,
  addToDock,
  isDefaultBrowser,
  setAsDefaultBrowser,
  launchAtLoginStatus,
  setLaunchAtLogin,
  type SystemInfo,
  type UpdaterState,
  type UpdateChannel,
  type AppIcon,
} from "@ardia/shell";
import { call } from "@ardia/ardiacore";

export { WIDEVINE_COMPONENT_ID } from "@ardia/ardiacore";

export const engineInfo = () => call("engine.info");
export const listComponents = () => call("engine.components");
