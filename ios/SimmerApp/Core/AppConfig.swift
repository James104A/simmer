import Foundation

enum AppConfig {
    /// Base URL for the Simmer Next.js backend. Override at build time by setting
    /// `SIMMER_API_BASE_URL` in the Info.plist or as a launch argument for debug builds.
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

    static let appGroupIdentifier = "group.com.simmer.app"
    static let keychainService = "com.simmer.app.session"
    static let bundleIdentifier = Bundle.main.bundleIdentifier ?? "com.simmer.app"
    static let appStoreURL = URL(string: "https://apps.apple.com/app/simmer/id0000000000")!
    static let privacyPolicyURL = URL(string: "https://simmer.app/privacy")!
    static let termsURL = URL(string: "https://simmer.app/terms")!
    static let supportEmail = "support@simmer.app"
}
