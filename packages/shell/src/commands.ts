import type { BrowserCommand } from "./browserCommand";
import { Shell } from "./shellNative";

export type CommandEvent = {
  command: BrowserCommand;
  arg: string | null;
  windowId: string | null;
  focusGeneration?: number | null;
};

export const onCommand = (listener: (e: CommandEvent) => void) => Shell.addListener("onCommand", listener);
