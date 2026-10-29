import { call, on, type PermissionRequest, type PermissionResult } from "@ardia/ardiacore";

export const onPermission = (listener: (p: PermissionRequest) => void) => on("permissions.requested", listener);
export const onPermissionDismissed = (listener: (p: { id: string }) => void) => on("permissions.dismissed", listener);
export const resolvePermission = (id: string, result: PermissionResult, remember = false) => call("permissions.resolve", { id, result, remember });

export {
  onDeviceChooser,
  selectDevice,
  cancelDeviceChooser,
  refreshDeviceChooser,
  openBluetoothSettings,
  type PermissionKind,
  type PermissionRequest,
  type PermissionResult,
  type DeviceChooser,
} from "@ardia/ardiacore";
