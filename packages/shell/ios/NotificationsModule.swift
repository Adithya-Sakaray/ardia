import AppKit
import ExpoModulesCore

public class NotificationsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ArdiaNotifications")
    Events(ShellEvents.Channel.notificationResponse.rawValue)

    OnCreate {
      DispatchQueue.main.async { NotificationHub.shared.install() }
    }

    OnStartObserving(ShellEvents.Channel.notificationResponse.rawValue) { ShellEvents.attach(.notificationResponse, to: self) }

    OnDestroy { ShellEvents.detach(self) }

    AsyncFunction("notificationPermission") { (promise: Promise) in
      NotificationHub.shared.permission { promise.resolve($0) }
    }.runOnQueue(.main)
    AsyncFunction("requestNotificationPermission") { (promise: Promise) in
      NotificationHub.shared.requestPermission { promise.resolve($0) }
    }.runOnQueue(.main)
    AsyncFunction("postNotification") { (options: NotificationOptions, promise: Promise) in
      NotificationHub.shared.post(options) { promise.resolve($0) }
    }.runOnQueue(.main)
    AsyncFunction("removeNotifications") { (ids: [String]) in NotificationHub.shared.remove(ids) }.runOnQueue(.main)
    AsyncFunction("openNotificationSettings") {
      let id = Bundle.main.bundleIdentifier ?? ""
      if let url = URL(string: "x-apple.systempreferences:com.apple.Notifications-Settings.extension?id=\(id)") {
        NSWorkspace.shared.open(url)
      }
    }.runOnQueue(.main)
  }
}
