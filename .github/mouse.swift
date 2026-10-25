import CoreGraphics
import Foundation

let args = CommandLine.arguments.dropFirst().compactMap(Double.init)
let target = CGPoint(x: args[0], y: args[1])
let start = CGEvent(source: nil)?.location ?? target
let steps = 14
for i in 1...steps {
  let t = Double(i) / Double(steps)
  let p = CGPoint(x: start.x + (target.x - start.x) * t, y: start.y + (target.y - start.y) * t)
  CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: p, mouseButton: .left)?.post(tap: .cghidEventTap)
  usleep(16_000)
}
print("moved \(start) -> \(CGEvent(source: nil)?.location ?? .zero)")
