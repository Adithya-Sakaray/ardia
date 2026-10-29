import ExpoModulesCore

public class ScriptingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ArdiaScripting")
    Events(ShellEvents.Channel.scriptCommand.rawValue)

    OnStartObserving(ShellEvents.Channel.scriptCommand.rawValue) { ShellEvents.attach(.scriptCommand, to: self) }

    OnDestroy { ShellEvents.detach(self) }

    AsyncFunction("setScriptState") { (state: ScriptState) in ShellScripting.state = state }.runOnQueue(.main)
    AsyncFunction("replyToScript") { (id: String, result: [String: Any]?, error: String?) in
      ShellScripting.reply(id, result: result, error: error)
    }.runOnQueue(.main)
  }
}
