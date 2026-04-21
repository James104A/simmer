import SwiftUI
import AuthenticationServices

struct AuthRootView: View {
    @Environment(AppState.self) private var appState
    @State private var mode: Mode = .welcome
    @State private var appleError: String?

    enum Mode: Hashable {
        case welcome, login, signup
    }

    var body: some View {
        NavigationStack {
            switch mode {
            case .welcome:
                welcome
            case .login:
                LoginView(onBack: { mode = .welcome })
            case .signup:
                SignupView(onBack: { mode = .welcome })
            }
        }
    }

    private var welcome: some View {
        VStack(spacing: 24) {
            Spacer()
            Text("Simmer")
                .font(.system(size: 52, weight: .bold, design: .rounded))
                .foregroundStyle(Color("BrandOrange"))
            Text("Your personal cookbook.")
                .font(.title3)
                .foregroundStyle(.secondary)
            Spacer()

            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                handleApple(result)
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 54)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            Button { mode = .login } label: {
                Text("Sign in with email")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)

            Button { mode = .signup } label: {
                Text("Create account")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .tint(Color("BrandOrange"))

            if let appleError {
                Text(appleError).font(.caption).foregroundStyle(.red)
            }

            Text("By continuing you agree to our [Terms](https://simmer.app/terms) and [Privacy Policy](https://simmer.app/privacy).")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.top, 8)
        }
        .padding(24)
        .background(Color("BrandCream").ignoresSafeArea())
    }

    private func handleApple(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let idToken = String(data: tokenData, encoding: .utf8)
            else {
                appleError = "Apple did not return an identity token."
                return
            }
            let fullName: String? = {
                guard let name = credential.fullName else { return nil }
                let formatter = PersonNameComponentsFormatter()
                let str = formatter.string(from: name).trimmingCharacters(in: .whitespaces)
                return str.isEmpty ? nil : str
            }()
            Task {
                do {
                    let response = try await APIClient.shared.signInWithApple(
                        idToken: idToken,
                        fullName: fullName
                    )
                    Analytics.shared.track("auth.apple.success")
                    appState.handleAuthSuccess(response)
                } catch {
                    Analytics.shared.trackError("auth.apple", error: error)
                    appleError = error.localizedDescription
                }
            }
        case .failure(let error):
            Analytics.shared.trackError("auth.apple.request", error: error)
            if (error as? ASAuthorizationError)?.code != .canceled {
                appleError = error.localizedDescription
            }
        }
    }
}
