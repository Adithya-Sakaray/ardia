import { beginTracing, endTracing, isTracing, openTaskManager } from "../../platform/performance";
import { confirm } from "../../platform/dialogs";
import { copyText } from "../../platform/clipboard";
import { engineInfo, isDefaultBrowser, openExternalURL, setAsDefaultBrowser, systemInfo, updaterState } from "../../platform/app";
import { onCommand, type CommandEvent } from "../../platform/commands";
import { onNotificationResponse } from "../../platform/notifications";
import { readDocument, saveDocument } from "../../platform/documents";
import { revealFile } from "../../platform/files";
import { maybeStartOnboarding, onboardingCompletedAt, startOnboarding, useOnboarding } from "../onboarding/onboarding";
import { openVideoTour, startToolTour } from "../onboarding/tour";
import { trackAppVersion } from "../releaseNotes/releaseNotes";
import { useBrowser } from "../browser/store";
import { focus, openUrls, switchToTab } from "../browser/actions";
import { afterFirstWindow } from "../../lib/afterFirstWindow";
import { offerDefaultBrowserAgain } from "../onboarding/defaultBrowserOffer";
import { openReleaseNotesAfterUpdate, openReleaseNotesPage } from "../releaseNotes/releaseNotesPage";
import { handleWebNotificationResponse } from "../site/webNotifications";
import { APP_COMMANDS } from "../commands/commandCatalog";
import { startHandoff } from "./handoff";
import { startScripting } from "./scripting";

export function startAppIntegration() {
  onCommand(runAppCommand);
  onNotificationResponse((response) => {
    if (handleWebNotificationResponse(response) || response.action !== "click") return;
    const s = useBrowser.getState();
    const { tabId, windowId } = response;
    if (tabId && s.tabs[tabId]) switchToTab(tabId);
    else if (windowId && s.windows[windowId]) focus(windowId);
  });
  startHandoff();
  startScripting();
  const updated = trackAppVersion();
  maybeStartOnboarding();
  if (updated) openReleaseNotesAfterUpdate();
  afterFirstWindow(() => {
    void offerDefaultBrowserAgain({
      read: readDocument,
      save: saveDocument,
      testInstance: systemInfo().isolatedInstance !== false,
      onboarding: !onboardingCompletedAt() || useOnboarding.getState().windowId !== null,
      isDefault: isDefaultBrowser,
      setDefault: setAsDefaultBrowser }).catch((error) => console.warn("[defaultBrowserOffer]", error));
  });
}

function runAppCommand({ command, windowId }: CommandEvent) {
  if (!APP_COMMANDS.has(command)) return;
  switch (command) {
    case "sendFeedback":
      return void sendFeedback(windowId);
    case "copyDiagnostics":
      return void diagnostics().then(copyText);
    case "recordPerformanceIssue":
      return void recordPerformanceIssue();
    case "showOnboarding":
      return startOnboarding(windowId);
    case "toolTour":
      return void startToolTour(windowId);
    case "videoTour":
      return openVideoTour(windowId);
    case "releaseNotes":
      return openReleaseNotesPage(windowId);
    case "taskManager":
      return void openTaskManager().catch(() => {});
  }
}

export async function sendFeedback(windowId?: string | null) {
  const app = systemInfo();
  const report = await diagnostics();
  const body = `What happened?\n\n\nWhat did you expect?\n\n\n---\n${report}`;
  const page = app.feedbackURL && /^https?:/i.test(app.feedbackURL) ? app.feedbackURL : null;
  if (page) return openUrls([page.replace("%s", encodeURIComponent(body))], windowId);
  const to = app.feedbackEmail && !/[\s?&]/.test(app.feedbackEmail) ? app.feedbackEmail : "";
  const draft = `mailto:${to}?subject=${encodeURIComponent(`${app.appName} Feedback`)}&body=${encodeURIComponent(body)}`;
  if (!(await openExternalURL(draft))) copyText(body);
}

export async function diagnostics(): Promise<string> {
  const app = systemInfo();
  const [engine, updates] = await Promise.all([engineInfo().catch(() => null), updaterState().catch(() => null)]);
  const s = useBrowser.getState();
  const regular = s.windowOrder.filter((id) => !s.windows[id]?.incognito);
  return [
    `${app.appName} ${app.appVersion} (${app.appBuild}) — ${app.configuration}`,
    engine ? `Engine: ArdiaCore, Chromium ${engine.chromiumVersion}` : "Engine: unavailable",
    `macOS ${app.osVersion} (${app.osBuild}), ${app.arch}, ${app.model}, ${Math.round(app.memoryGB)} GB`,
    `Bundle: ${app.bundleId}, locale ${app.locale}`,
    `Windows: ${regular.length} (+${s.windowOrder.length - regular.length} incognito), tabs: ${Object.keys(s.tabs).length}, profiles: ${s.profileOrder.length}`,
    !updates?.available
      ? "Updates: not built in"
      : !updates.configured
        ? "Updates: not set up for this build"
        : `Updates: automatic checks ${updates.automaticChecks ? "on" : "off"}, feed ${updates.feedURL ?? "none"}`,
  ].join("\n");
}

async function recordPerformanceIssue() {
  if (await isTracing()) return;
  const start = await confirm({
    title: "Record a performance issue?",
    message: "Ardia records what the engine does while you reproduce the problem. The recording is saved to your Downloads folder.",
    confirmTitle: "Start Recording" });
  if (!start.confirmed || !(await beginTracing())) return;
  const stop = await confirm({ title: "Recording…", message: "Reproduce the problem now, then click Stop.", confirmTitle: "Stop", cancelTitle: "Discard" });
  const path = await endTracing(stop.confirmed);
  if (path) void revealFile(path);
}
