import Foundation
import UIKit
import UserNotifications
import OSLog

/// Handles APNs device-token registration with Apple and with the Simmer
/// backend. Orchestrated from the App lifecycle and AuthStatus changes.
@MainActor
final class PushRegistrar: NSObject {
    static let shared = PushRegistrar()

    private let logger = Logger(subsystem: AppConfig.bundleIdentifier, category: "Push")
    private var currentToken: String?

    func requestAuthorizationIfNeeded() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .notDetermined:
            do {
                let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
                Analytics.shared.track("push.permission", ["granted": String(granted)])
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } catch {
                Analytics.shared.trackError("push.permission", error: error)
            }
        case .authorized, .provisional, .ephemeral:
            UIApplication.shared.registerForRemoteNotifications()
        case .denied:
            break
        @unknown default:
            break
        }
    }

    func didRegister(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        currentToken = token
        logger.info("APNs token \(token, privacy: .private)")
        Task {
            do {
                let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
                try await APIClient.shared.registerDevice(apnsToken: token, appVersion: version)
                Analytics.shared.track("push.registered")
            } catch {
                Analytics.shared.trackError("push.register", error: error)
            }
        }
    }

    func didFailToRegister(error: Error) {
        logger.error("APNs registration failed: \(error.localizedDescription)")
        Analytics.shared.trackError("push.register", error: error)
    }

    func unregister() async {
        guard let token = currentToken else { return }
        do {
            try await APIClient.shared.unregisterDevice(apnsToken: token)
        } catch {
            Analytics.shared.trackError("push.unregister", error: error)
        }
        currentToken = nil
    }
}
