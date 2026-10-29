import { call, on, type CliControlStatus } from "@ardia/ardiacore";

export { installCli, installedCliVersion, onCliInstallLine, type CliInstallResult } from "@ardia/shell";
export type { CliControlStatus };

export const setCliControl = (on: boolean) => call("engine.setCliControl", { on });
export const setCliActiveTab = (tabId: string | null) => call("engine.setCliActiveTab", { tabId });
export const cliControlStatus = () => call("engine.cliControlStatus");
export const onCliControlChanged = (listener: (status: CliControlStatus) => void) => on("engine.cliControl", listener);
