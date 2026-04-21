import Foundation

struct User: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let email: String
    var hasSeenOnboarding: Bool?
}

struct AuthResponse: Codable, Sendable {
    let success: Bool
    let token: String
    let expiresAt: Date
    let user: User
}

struct MeResponse: Codable, Sendable {
    let user: User?
}
