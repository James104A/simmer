import Foundation
import OSLog

/// Lightweight debug analytics. Writes structured events to OSLog and a
/// rotating in-memory ring buffer the user can view in Settings → Debug.
/// Swap this out for PostHog / Mixpanel / TelemetryDeck later without touching
/// call sites.
@MainActor
final class Analytics {
    static let shared = Analytics()

    private let logger = Logger(subsystem: AppConfig.bundleIdentifier, category: "Analytics")
    private let maxEvents = 500
    private(set) var recentEvents: [Event] = []

    struct Event: Identifiable {
        let id = UUID()
        let timestamp: Date
        let name: String
        let properties: [String: String]

        var display: String {
            let parts = properties.map { "\($0)=\($1)" }.sorted().joined(separator: " ")
            return parts.isEmpty ? name : "\(name) \(parts)"
        }
    }

    func track(_ name: String, _ properties: [String: String] = [:]) {
        let event = Event(timestamp: Date(), name: name, properties: properties)
        recentEvents.append(event)
        if recentEvents.count > maxEvents {
            recentEvents.removeFirst(recentEvents.count - maxEvents)
        }
        let propsStr = properties.map { "\($0)=\($1)" }.sorted().joined(separator: " ")
        logger.info("\(name, privacy: .public) \(propsStr, privacy: .public)")
    }

    func trackError(_ name: String, error: Error, extra: [String: String] = [:]) {
        var props = extra
        props["error"] = String(describing: type(of: error))
        props["message"] = error.localizedDescription
        track("error.\(name)", props)
    }

    func clear() {
        recentEvents.removeAll()
    }
}
