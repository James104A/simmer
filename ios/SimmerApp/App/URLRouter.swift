import Foundation

/// Parses incoming URLs (custom scheme `simmer://…` or universal links
/// `https://simmer.app/…`) into AppState deep links.
enum URLRouter {
    static func route(_ url: URL) -> AppState.DeepLink? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return nil
        }
        let path = components.path.split(separator: "/").map(String.init)
        switch path.first {
        case "feed": return .feed
        case "friends": return .friends
        case "recipes" where path.count >= 2:
            return .recipe(id: path[1])
        case "partner" where path.count >= 2 && path[1] == "invite":
            if let sender = components.queryItems?.first(where: { $0.name == "from" })?.value {
                return .partnerInvite(fromUserId: sender)
            }
            return nil
        default:
            return nil
        }
    }
}
