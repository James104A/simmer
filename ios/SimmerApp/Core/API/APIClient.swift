import Foundation
import OSLog

/// Typed client around the Simmer Next.js API. One shared instance per app,
/// accessed via `APIClient.shared`. Bearer-token auth with automatic read
/// from Keychain.
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    private let logger = Logger(subsystem: AppConfig.bundleIdentifier, category: "APIClient")

    init(session: URLSession = .shared) {
        self.session = session

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { d in
            let container = try d.singleValueContainer()
            let raw = try container.decode(String.self)
            if let date = ISO8601DateFormatter.withFractional.date(from: raw)
                ?? ISO8601DateFormatter.plain.date(from: raw) {
                return date
            }
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unrecognized date \(raw)"
            )
        }
        self.decoder = decoder
    }

    // MARK: - Request helpers

    private func buildURL(_ path: String, query: [URLQueryItem]) -> URL? {
        var components = URLComponents(
            url: AppConfig.apiBaseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: false
        )
        if !query.isEmpty { components?.queryItems = query }
        return components?.url
    }

    private func makeRequest(
        path: String,
        method: String = "GET",
        query: [URLQueryItem] = [],
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) throws -> URLRequest {
        guard let url = buildURL(path, query: query) else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("ios", forHTTPHeaderField: "X-Simmer-Client")
        if requiresAuth {
            guard let token = KeychainStore.get(.sessionToken) else {
                throw APIError.notAuthenticated
            }
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try encoder.encode(AnyEncodable(body))
        }
        return req
    }

    private func perform<T: Decodable>(
        _ req: URLRequest,
        as type: T.Type = T.self
    ) async throws -> T {
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: req)
        } catch {
            throw APIError.transport(error)
        }
        guard let http = response as? HTTPURLResponse else {
            throw APIError.empty
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? decoder.decode(APIErrorBody.self, from: data))?.error
            logger.warning("API \(http.statusCode) \(req.httpMethod ?? "GET") \(req.url?.path ?? ""): \(message ?? "—")")
            throw APIError.server(status: http.statusCode, message: message)
        }
        if data.isEmpty, let empty = EmptyResponse() as? T { return empty }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            logger.error("Decode failed for \(req.url?.path ?? ""): \(error.localizedDescription)")
            throw APIError.decoding(error)
        }
    }

    private func performVoid(_ req: URLRequest) async throws {
        _ = try await perform(req, as: EmptyResponse.self)
    }

    // MARK: - Auth

    func login(email: String, password: String) async throws -> AuthResponse {
        let req = try makeRequest(
            path: "/api/auth/login",
            method: "POST",
            body: ["email": email, "password": password],
            requiresAuth: false
        )
        return try await perform(req)
    }

    func signup(name: String, email: String, password: String) async throws -> AuthResponse {
        let req = try makeRequest(
            path: "/api/auth/signup",
            method: "POST",
            body: ["name": name, "email": email, "password": password],
            requiresAuth: false
        )
        return try await perform(req)
    }

    func signInWithApple(idToken: String, fullName: String?) async throws -> AuthResponse {
        var body: [String: String] = ["idToken": idToken]
        if let fullName { body["fullName"] = fullName }
        let req = try makeRequest(
            path: "/api/auth/apple",
            method: "POST",
            body: body,
            requiresAuth: false
        )
        return try await perform(req)
    }

    func me() async throws -> User? {
        let req = try makeRequest(path: "/api/me")
        let response: MeResponse = try await perform(req)
        return response.user
    }

    func logout() async throws {
        let req = try makeRequest(path: "/api/auth/logout", method: "POST")
        try await performVoid(req)
    }

    func deleteAccount(password: String?) async throws {
        let req: URLRequest
        if let password {
            req = try makeRequest(
                path: "/api/account",
                method: "DELETE",
                body: ["password": password]
            )
        } else {
            req = try makeRequest(path: "/api/account", method: "DELETE")
        }
        try await performVoid(req)
    }

    // MARK: - Recipes

    func fetchRecipes() async throws -> [Recipe] {
        let req = try makeRequest(path: "/api/recipes")
        return try await perform(req)
    }

    func fetchRecipe(id: String) async throws -> Recipe {
        let req = try makeRequest(path: "/api/recipes/\(id)")
        return try await perform(req)
    }

    func createRecipe(_ draft: RecipeDraft) async throws -> Recipe {
        let req = try makeRequest(path: "/api/recipes", method: "POST", body: draft)
        return try await perform(req)
    }

    func updateRecipe(id: String, patch: RecipePatch) async throws -> Recipe {
        let req = try makeRequest(path: "/api/recipes/\(id)", method: "PATCH", body: patch)
        return try await perform(req)
    }

    func deleteRecipe(id: String) async throws {
        let req = try makeRequest(path: "/api/recipes/\(id)", method: "DELETE")
        try await performVoid(req)
    }

    func summarizeURL(_ url: String) async throws -> SummarizeResponse {
        let req = try makeRequest(
            path: "/api/recipes/summarize",
            method: "POST",
            body: ["url": url]
        )
        return try await perform(req)
    }

    func logCook(
        recipeId: String,
        notes: String?,
        favorite: Bool,
        cookedAt: Date = Date()
    ) async throws {
        let body: [String: AnyEncodableValue] = [
            "notes": .string(notes),
            "favorite": .bool(favorite),
            "cookedAt": .date(cookedAt),
        ]
        let req = try makeRequest(
            path: "/api/recipes/\(recipeId)/cook",
            method: "POST",
            body: body
        )
        try await performVoid(req)
    }

    func discardCook(recipeId: String) async throws {
        let req = try makeRequest(
            path: "/api/recipes/\(recipeId)/cook",
            method: "POST",
            body: ["discard": true]
        )
        try await performVoid(req)
    }

    // MARK: - Saved recipes

    func fetchSaved() async throws -> [Recipe] {
        struct SavedWrapper: Decodable {
            let recipe: Recipe
        }
        let req = try makeRequest(path: "/api/saved-recipes")
        let wrappers: [SavedWrapper] = try await perform(req)
        return wrappers.map(\.recipe)
    }

    func saveRecipe(id: String) async throws {
        let req = try makeRequest(
            path: "/api/saved-recipes",
            method: "POST",
            body: ["recipeId": id]
        )
        try await performVoid(req)
    }

    func unsaveRecipe(id: String) async throws {
        let req = try makeRequest(
            path: "/api/saved-recipes",
            method: "DELETE",
            body: ["recipeId": id]
        )
        try await performVoid(req)
    }

    // MARK: - Friends

    func fetchFriends() async throws -> [Friend] {
        let req = try makeRequest(path: "/api/friends")
        return try await perform(req)
    }

    func searchUsers(query: String) async throws -> [Friend] {
        let req = try makeRequest(
            path: "/api/friends/search",
            query: [.init(name: "q", value: query)]
        )
        return try await perform(req)
    }

    func sendFriendRequest(email: String) async throws {
        let req = try makeRequest(
            path: "/api/friends",
            method: "POST",
            body: ["email": email]
        )
        try await performVoid(req)
    }

    func fetchIncomingFriendRequests() async throws -> [FriendRequest] {
        let req = try makeRequest(path: "/api/friends/requests")
        return try await perform(req)
    }

    func respondToFriendRequest(id: String, action: FriendRequestAction) async throws {
        let req = try makeRequest(
            path: "/api/friends/requests/\(id)",
            method: "PATCH",
            body: ["action": action.rawValue]
        )
        try await performVoid(req)
    }

    // MARK: - Partner

    func fetchPartner() async throws -> Partnership? {
        // The server returns raw `null` if no partnership. Decode leniently.
        let req = try makeRequest(path: "/api/partner")
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw APIError.server(status: status, message: nil)
        }
        if data.isEmpty { return nil }
        if let text = String(data: data, encoding: .utf8),
           text.trimmingCharacters(in: .whitespacesAndNewlines) == "null" {
            return nil
        }
        return try decoder.decode(Partnership.self, from: data)
    }

    func invitePartner(email: String) async throws {
        let req = try makeRequest(
            path: "/api/partner",
            method: "POST",
            body: ["email": email]
        )
        try await performVoid(req)
    }

    func fetchIncomingPartnerRequests() async throws -> [PartnerRequest] {
        let req = try makeRequest(path: "/api/partner/requests")
        return try await perform(req)
    }

    func respondToPartnerRequest(id: String, action: FriendRequestAction) async throws {
        let req = try makeRequest(
            path: "/api/partner/requests",
            method: "PATCH",
            body: ["partnershipId": id, "action": action.rawValue]
        )
        try await performVoid(req)
    }

    func unlinkPartner() async throws {
        let req = try makeRequest(path: "/api/partner", method: "DELETE")
        try await performVoid(req)
    }

    // MARK: - Feed

    func fetchFeed(since: Date? = nil) async throws -> [FeedEvent] {
        var query: [URLQueryItem] = []
        if let since {
            query.append(.init(name: "since", value: ISO8601DateFormatter.plain.string(from: since)))
        }
        let req = try makeRequest(path: "/api/feed", query: query)
        return try await perform(req)
    }

    // MARK: - Onboarding

    func completeOnboarding() async throws {
        let req = try makeRequest(path: "/api/onboarding", method: "POST")
        try await performVoid(req)
    }

    // MARK: - Moderation

    func fetchBlocks() async throws -> [Block] {
        let req = try makeRequest(path: "/api/blocks")
        return try await perform(req)
    }

    func blockUser(userId: String) async throws {
        let req = try makeRequest(
            path: "/api/blocks",
            method: "POST",
            body: ["userId": userId]
        )
        try await performVoid(req)
    }

    func unblockUser(userId: String) async throws {
        let req = try makeRequest(
            path: "/api/blocks",
            method: "DELETE",
            query: [.init(name: "userId", value: userId)]
        )
        try await performVoid(req)
    }

    func report(targetType: ReportTargetType, targetId: String, reason: ReportReason, details: String?) async throws {
        let body: [String: AnyEncodableValue] = [
            "targetType": .string(targetType.rawValue),
            "targetId": .string(targetId),
            "reason": .string(reason.rawValue),
            "details": .string(details),
        ]
        let req = try makeRequest(
            path: "/api/reports",
            method: "POST",
            body: body
        )
        try await performVoid(req)
    }

    // MARK: - Device registration

    func registerDevice(apnsToken: String, appVersion: String?) async throws {
        let body: [String: AnyEncodableValue] = [
            "apnsToken": .string(apnsToken),
            "platform": .string("ios"),
            "appVersion": .string(appVersion),
        ]
        let req = try makeRequest(
            path: "/api/devices",
            method: "POST",
            body: body
        )
        try await performVoid(req)
    }

    func unregisterDevice(apnsToken: String) async throws {
        let req = try makeRequest(
            path: "/api/devices",
            method: "DELETE",
            query: [.init(name: "apnsToken", value: apnsToken)]
        )
        try await performVoid(req)
    }
}

// MARK: - Supporting types

enum FriendRequestAction: String, Codable, Sendable {
    case accept
    case decline
}

enum ReportTargetType: String, Codable, CaseIterable, Sendable {
    case recipe
    case user
    case feed_event
}

enum ReportReason: String, Codable, CaseIterable, Sendable {
    case spam
    case abuse
    case inappropriate
    case impersonation
    case other

    var label: String {
        switch self {
        case .spam: return "Spam"
        case .abuse: return "Abuse or harassment"
        case .inappropriate: return "Inappropriate content"
        case .impersonation: return "Impersonation"
        case .other: return "Other"
        }
    }
}

struct EmptyResponse: Decodable, Sendable {}

/// Wrapper around any Encodable so JSONEncoder can handle heterogeneous bodies.
struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ value: Encodable) { self.value = value }
    func encode(to encoder: Encoder) throws {
        try value.encode(to: encoder)
    }
}

enum AnyEncodableValue: Encodable {
    case string(String?)
    case bool(Bool)
    case int(Int)
    case date(Date)

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let s): try container.encode(s)
        case .bool(let b): try container.encode(b)
        case .int(let i): try container.encode(i)
        case .date(let d): try container.encode(ISO8601DateFormatter.plain.string(from: d))
        }
    }
}

extension ISO8601DateFormatter {
    static let plain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
    static let withFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
