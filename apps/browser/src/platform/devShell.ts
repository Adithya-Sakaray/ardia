import * as shellPackage from "@ardia/shell";
import * as app from "./app";
import * as dev from "./dev";
import * as introMusic from "./introMusic";
import * as notifications from "./notifications";
import * as scripting from "./scripting";
import * as share from "./share";
import * as windows from "./windows";

export const shell = { ...shellPackage, ...app, ...windows, ...share, ...introMusic, ...notifications, ...scripting, ...dev };
