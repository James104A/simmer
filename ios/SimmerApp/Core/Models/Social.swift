import Foundation

struct Friend: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let email: String
}

struct FriendRequest: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let senderId: String
    let receiverId: String
    let status: String
    let createdAt: Date
    let updatedAt: Date?
    let sender: Friend?
}

struct Partnership: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let partner: Friend
    let createdAt: Date
}

struct PartnerRequest: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let senderId: String
    let receiverId: String
    let status: String
    let createdAt: Date
    let sender: Friend
}

struct FeedEvent: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let userId: String
    let eventType: String
    let recipeId: String?
    let metadata: String?
    let createdAt: Date
    let user: Friend
    let recipe: FeedRecipeRef?

    struct FeedRecipeRef: Codable, Hashable, Sendable {
        let id: String
        let title: String
        let imageUrl: String?
        let descriptionShort: String?
        let cuisineTypes: String?
        let dishTypes: String?
        let totalTimeMinutes: Int?
        let rating: Int?
    }
}

struct Block: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let blockerId: String
    let blockedId: String
    let blocked: Friend
    let createdAt: Date
}
