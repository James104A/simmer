import SwiftUI

struct DeleteAccountView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var password = ""
    @State private var confirmed = false
    @State private var isDeleting = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Deleting your account permanently removes your recipes, cook history, friends, and partner link. This can't be undone.")
                        .font(.callout)
                }
                Section("Confirm password") {
                    SecureField("Password", text: $password)
                        .textContentType(.password)
                }
                Section {
                    Toggle("I understand this is permanent", isOn: $confirmed)
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
                Section {
                    Button(role: .destructive, action: deleteAccount) {
                        HStack {
                            Spacer()
                            if isDeleting { ProgressView() } else { Text("Delete account").bold() }
                            Spacer()
                        }
                    }
                    .disabled(!confirmed || password.isEmpty || isDeleting)
                }
            }
            .navigationTitle("Delete account")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func deleteAccount() {
        isDeleting = true
        error = nil
        Task {
            defer { isDeleting = false }
            do {
                try await APIClient.shared.deleteAccount(password: password)
                Analytics.shared.track("account.delete.success")
                await appState.signOut()
                dismiss()
            } catch {
                Analytics.shared.trackError("account.delete", error: error)
                self.error = error.localizedDescription
            }
        }
    }
}
