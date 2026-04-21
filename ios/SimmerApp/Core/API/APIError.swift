import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case notAuthenticated
    case server(status: Int, message: String?)
    case decoding(Error)
    case transport(Error)
    case empty

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .notAuthenticated: return "You're signed out. Please sign in again."
        case .server(_, let message): return message ?? "Server error"
        case .decoding(let e): return "Could not decode response: \(e.localizedDescription)"
        case .transport(let e): return e.localizedDescription
        case .empty: return "Empty response"
        }
    }

    var isAuthError: Bool {
        if case .server(let status, _) = self, status == 401 { return true }
        if case .notAuthenticated = self { return true }
        return false
    }
}

struct APIErrorBody: Decodable {
    let error: String?
}
