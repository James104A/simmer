import SwiftUI

struct LoginView: View {
    @Environment(AppState.self) private var appState
    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var error: String?
    let onBack: () -> Void

    var body: some View {
        Form {
            Section {
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .textInputAutocapitalization(.never)
                SecureField("Password", text: $password)
                    .textContentType(.password)
            }
            if let error {
                Section { Text(error).foregroundStyle(.red).font(.callout) }
            }
            Section {
                Button(action: submit) {
                    HStack {
                        Spacer()
                        if isSubmitting { ProgressView() } else { Text("Sign in").bold() }
                        Spacer()
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color("BrandOrange"))
                .disabled(!canSubmit)
            }
        }
        .navigationTitle("Sign in")
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Back", action: onBack)
            }
        }
    }

    private var canSubmit: Bool {
        !email.isEmpty && password.count >= 8 && !isSubmitting
    }

    private func submit() {
        isSubmitting = true
        error = nil
        Task {
            defer { isSubmitting = false }
            do {
                let response = try await APIClient.shared.login(email: email, password: password)
                Analytics.shared.track("auth.login.success")
                appState.handleAuthSuccess(response)
            } catch {
                Analytics.shared.trackError("auth.login", error: error)
                self.error = error.localizedDescription
            }
        }
    }
}
