import { requireNativeModule } from "expo-modules-core";
import type { AppNative } from "./app";
import type { CliNative } from "./cli";
import type { DevNative } from "./dev";
import type { InlineCompletionNative } from "./inlineCompletion";
import type { CalendarNative, KeychainNative } from "./live";
import type { NotificationsNative } from "./notifications";
import type { ScriptingNative } from "./scripting";
import type { ShellNative } from "./shellNative";
import type { FileDropNative, MagnifyAreaNative, SystemNative } from "./system";
import type { TranslationModule } from "./translation";
import type { UpdaterNative } from "./updater";
import type { UserScriptsNative } from "./userScripts";
import type { DockSelectionNative, GlassEffectNative } from "./views";

export type ShellNativeModules = {
  ArdiaShell: ShellNative;
  ArdiaApp: AppNative;
  ArdiaUpdater: UpdaterNative;
  ArdiaNotifications: NotificationsNative;
  ArdiaScripting: ScriptingNative;
  ArdiaDev: DevNative;
  ArdiaSystem: SystemNative;
  ArdiaCalendar: CalendarNative;
  ArdiaKeychain: KeychainNative;
  ArdiaGlassEffect: GlassEffectNative;
  ArdiaDockSelection: DockSelectionNative;
  ArdiaInlineCompletion: InlineCompletionNative;
  ArdiaTranslate: TranslationModule;
  ArdiaMagnifyArea: MagnifyAreaNative;
  ArdiaFileDrop: FileDropNative;
  ArdiaCli: CliNative;
  ArdiaUserScripts: UserScriptsNative;
};

export const nativeModule = <Name extends keyof ShellNativeModules>(name: Name) => requireNativeModule<ShellNativeModules[Name]>(name);
