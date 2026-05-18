import Foundation
import Security

/// Tiny Keychain wrapper. Stores the Simmer session token using a generic
/// password item keyed by `account`. We use kSecAttrAccessibleAfterFirstUnlock
/// so the Share Extension can read the token when invoked while the device
/// is unlocked (standard for app-group-shared credentials).
enum KeychainStore {
    enum Account: String {
        case sessionToken = "simmer.session.token"
        case userId = "simmer.user.id"
        case expiresAt = "simmer.session.expires"
    }

    enum KeychainError: Error {
        case unhandled(OSStatus)
    }

    @discardableResult
    static func set(_ value: String, for account: Account) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }

        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConfig.keychainService,
            kSecAttrAccount as String: account.rawValue,
            kSecAttrAccessGroup as String: AppConfig.appGroupIdentifier,
        ]

        SecItemDelete(base as CFDictionary)

        var attrs = base
        attrs[kSecValueData as String] = data
        attrs[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock

        let status = SecItemAdd(attrs as CFDictionary, nil)
        return status == errSecSuccess
    }

    static func get(_ account: Account) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConfig.keychainService,
            kSecAttrAccount as String: account.rawValue,
            kSecAttrAccessGroup as String: AppConfig.appGroupIdentifier,
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

    @discardableResult
    static func remove(_ account: Account) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: AppConfig.keychainService,
            kSecAttrAccount as String: account.rawValue,
            kSecAttrAccessGroup as String: AppConfig.appGroupIdentifier,
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    static func clearSession() {
        remove(.sessionToken)
        remove(.userId)
        remove(.expiresAt)
    }
}
