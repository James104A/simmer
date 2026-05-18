import Foundation
import Observation
import OSLog

@MainActor
@Observable
final class AppState {
    enum AuthStatus: Equatable {
        case unknown
        case signedOut
        case signedIn(User)
    }

    var auth: AuthStatus = .unknown
    var hasSeenOnboarding: Bool = false
    var showOnboarding: Bool = false
    var pendingDeepLink: DeepLink?

    private let logger = Logger(subsystem: AppConfig.bundleIdentifier, category: "AppState")

    var currentUser: User? {
        if case .signedIn(let user) = auth { return user }
        return nil
    }

    // MARK: - Bootstrap

    func bootstrap() async {
        guard KeychainStore.get(.sessionToken) != nil else {
            auth = .signedOut
            return
        }
        do {
            guard let user = try await APIClient.shared.me() else {
                KeychainStore.clearSession()
                auth = .signedOut
                return
            }
            auth = .signedIn(user)
            hasSeenOnboarding = user.hasSeenOnboarding ?? false
            showOnboarding = !hasSeenOnboarding
        } catch APIError.notAuthenticated {
            KeychainStore.clearSession()
            auth = .signedOut
        } catch {
            logger.error("bootstrap failed: \(error.localizedDescription)")
            // Offline: stay signed in optimistically using cached user if we have one.
            auth = .signedOut
        }
    }

    // MARK: - Auth transitions

    func handleAuthSuccess(_ response: AuthResponse) {
        KeychainStore.set(response.token, for: .sessionToken)
        KeychainStore.set(response.user.id, for: .userId)
        KeychainStore.set(
            ISO8601DateFormatter.plain.string(from: response.expiresAt),
            for: .expiresAt
        )
        auth = .signedIn(response.user)
        hasSeenOnboarding = response.user.hasSeenOnboarding ?? false
        showOnboarding = !hasSeenOnboarding
    }

    func signOut() async {
        try? await APIClient.shared.logout()
        await PushRegistrar.shared.unregister()
        KeychainStore.clearSession()
        auth = .signedOut
        hasSeenOnboarding = false
        showOnboarding = false
    }

    func markOnboardingComplete() {
        hasSeenOnboarding = true
        showOnboarding = false
        Task { try? await APIClient.shared.completeOnboarding() }
    }

    // MARK: - Deep links

    enum DeepLink: Equatable {
        case feed
        case friends
        case partnerInvite(fromUserId: String)
        case recipe(id: String)
    }

    func handle(deepLink: DeepLink) {
        pendingDeepLink = deepLink
    }

    func consumeDeepLink() -> DeepLink? {
        defer { pendingDeepLink = nil }
        return pendingDeepLink
    }
}
