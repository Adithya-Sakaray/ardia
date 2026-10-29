type CliServer = { connections: number; generation: number; file: string; reason?: string };

export type CliControlStatus =
  | { state: "external" }
  | ({ state: "off" | "starting" } & CliServer)
  | ({ state: "on"; port: number } & CliServer);
