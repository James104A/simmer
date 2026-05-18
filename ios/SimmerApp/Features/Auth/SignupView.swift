import SwiftUI

struct SignupView: View {
    @Environment(AppState.self) private var appState
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var error: String?
    let onBack: () -> Void

    var body: some View {
        Form {
            Section {
                TextField("Name", text: $name)
                    .textContentType(.name)
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                SecureField("Password (8+ characters)", text: $password)
                    .textContentType(.newPassword)
            }
            if let error {
                Section { Text(error).foregroundStyle(.red).font(.callout) }
            }
            Section {
                Button(action: submit) {
                    HStack {
                        Spacer()
                        if isSubmitting { ProgressView() } else { Text("Create account").bold() }
                        Spacer()
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color("BrandOrange"))
                .disabled(!canSubmit)
            } footer: {
                Text("By creating an account you agree to our Terms and Privacy Policy.")
            }
        }
        .navigationTitle("Create account")
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Back", action: onBack)
            }
        }
    }

    private var canSubmit: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && !email.isEmpty
            && password.count >= 8
            && !isSubmitting
    }

    private func submit() {
        isSubmitting = true
        error = nil
        Task {
            defer { isSubmitting = false }
            do {
                let response = try await APIClient.shared.signup(name: name, email: email, password: password)
                Analytics.shared.track("auth.signup.success")
                appState.handleAuthSuccess(response)
            } catch {
                Analytics.shared.trackError("auth.signup", error: error)
                self.error = error.localizedDescription
            }
        }
    }
}
