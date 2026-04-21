import Foundation
import Security

/// Duplicated from the main app. Extensions can't import the app target
/// directly without turning shared code into a framework; for just two
/// primitives it's cleaner to duplicate than to set up a framework target.
enum SharedConfig {
    static let appGroupIdentifier = "group.com.simmer.app"
    static let keychainService = "com.simmer.app.session"
    static let apiBaseURL: URL = {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "SimmerAPIBaseURL") as? String,
           let url = URL(string: raw) {
            return url
        }
        #if DEBUG
        return URL(string: "http://localhost:3000")!
        #else
        return URL(string: "https://simmer.app")!
        #endif
    }()
}

enum SharedKeychain {
    static func getSessionToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: SharedConfig.keychainService,
            kSecAttrAccount as String: "simmer.session.token",
            kSecAttrAccessGroup as String: SharedConfig.appGroupIdentifier,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8)
        else { return nil }
        return string
    }
}
