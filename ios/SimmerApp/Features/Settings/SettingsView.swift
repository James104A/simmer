import SwiftUI
import LocalAuthentication

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @AppStorage("simmer.biometricUnlock") private var biometricUnlock = false
    @State private var showDelete = false
    @State private var showAbout = false
    @State private var showDebug = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    if let user = appState.currentUser {
                        LabeledContent("Name", value: user.name)
                        LabeledContent("Email", value: user.email)
                    }
                }

                Section("Security") {
                    Toggle("Unlock with Face ID", isOn: $biometricUnlock)
                        .onChange(of: biometricUnlock) { _, enabled in
                            if enabled { _ = BiometricAuth.canEvaluate() }
                        }
                }

                Section("Privacy & safety") {
                    NavigationLink("Blocked users") { BlocksView() }
                    Link("Privacy policy", destination: AppConfig.privacyPolicyURL)
                    Link("Terms of service", destination: AppConfig.termsURL)
                    Link("Contact support", destination: URL(string: "mailto:\(AppConfig.supportEmail)")!)
                }

                Section {
                    Button("Sign out") {
                        Task { await appState.signOut() }
                    }
                    Button("Delete account", role: .destructive) {
                        showDelete = true
                    }
                }

                #if DEBUG
                Section("Debug") {
                    Button("View event log") { showDebug = true }
                    LabeledContent("API", value: AppConfig.apiBaseURL.absoluteString)
                }
                #endif

                Section {
                    Button("About Simmer") { showAbout = true }
                } footer: {
                    Text("Simmer v\(Bundle.main.shortVersion) (\(Bundle.main.buildNumber))")
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showDelete) { DeleteAccountView() }
            .sheet(isPresented: $showAbout) { AboutView() }
            .sheet(isPresented: $showDebug) { DebugLogView() }
        }
    }
}

extension Bundle {
    var shortVersion: String {
        infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
    var buildNumber: String {
        infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}

struct AboutView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("Simmer")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .foregroundStyle(Color("BrandOrange"))
                Text("Your personal cookbook.")
                    .foregroundStyle(.secondary)
                Text("v\(Bundle.main.shortVersion) (\(Bundle.main.buildNumber))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .padding(.top, 40)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct DebugLogView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var events: [Analytics.Event] = []

    var body: some View {
        NavigationStack {
            List(events.reversed()) { event in
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.name).font(.callout.bold())
                    if !event.properties.isEmpty {
                        Text(event.properties.map { "\($0)=\($1)" }.sorted().joined(separator: " "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Text(event.timestamp, style: .time)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Event log")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Clear") { Analytics.shared.clear(); events = [] }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { events = Analytics.shared.recentEvents }
        }
    }
}

enum BiometricAuth {
    static func canEvaluate() -> Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    static func authenticate(reason: String) async -> Bool {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return false
        }
        return await withCheckedContinuation { cont in
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, _ in
                cont.resume(returning: success)
            }
        }
    }
}
