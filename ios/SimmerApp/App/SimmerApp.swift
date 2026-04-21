import SwiftUI
import UIKit
import UserNotifications

@main
struct SimmerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .task {
                    Analytics.shared.track("app.launch")
                    await appState.bootstrap()
                }
                .onOpenURL { url in
                    if let link = URLRouter.route(url) {
                        appState.handle(deepLink: link)
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: .simmerDeepLink)) { note in
                    if let link = note.userInfo?["link"] as? AppState.DeepLink {
                        appState.handle(deepLink: link)
                    }
                }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active {
                        UNUserNotificationCenter.current().setBadgeCount(0)
                    }
                }
        }
    }

    @Environment(\.scenePhase) private var scenePhase
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task { @MainActor in PushRegistrar.shared.didRegister(deviceToken: deviceToken) }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        Task { @MainActor in PushRegistrar.shared.didFailToRegister(error: error) }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound, .badge]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        guard let type = userInfo["type"] as? String else { return }
        let link: AppState.DeepLink?
        switch type {
        case "friend_request", "friend_accept":
            link = .friends
        case "partner_invite":
            link = .friends
        case "partner_cook":
            if let recipeId = userInfo["recipeId"] as? String {
                link = .recipe(id: recipeId)
            } else {
                link = .feed
            }
        default:
            link = nil
        }
        guard let link else { return }
        await MainActor.run {
            NotificationCenter.default.post(
                name: .simmerDeepLink,
                object: nil,
                userInfo: ["link": link]
            )
        }
    }
}

extension Notification.Name {
    static let simmerDeepLink = Notification.Name("com.simmer.app.deepLink")
}
