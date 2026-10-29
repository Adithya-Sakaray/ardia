import * as shellPackage from "@ardia/shell";
import * as app from "./app";
import * as calendar from "./calendar";
import * as cli from "./cli";
import * as dev from "./dev";
import * as introMusic from "./introMusic";
import * as keychain from "./keychain";
import * as notifications from "./notifications";
import * as scripting from "./scripting";
import * as share from "./share";
import * as userScripts from "./userScripts";
import * as windows from "./windows";

export const shell = { ...shellPackage, ...app, ...windows, ...share, ...introMusic, ...notifications, ...scripting, ...calendar, ...keychain, ...cli, ...userScripts, ...dev };
