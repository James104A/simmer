import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        switch appState.auth {
        case .unknown:
            SplashView()
        case .signedOut:
            AuthRootView()
        case .signedIn:
            MainTabView()
                .sheet(isPresented: Binding(
                    get: { appState.showOnboarding },
                    set: { if !$0 { appState.showOnboarding = false } }
                )) {
                    OnboardingView()
                        .interactiveDismissDisabled()
                }
        }
    }
}

struct SplashView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("Simmer")
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(Color("BrandOrange"))
            ProgressView()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color("BrandCream").ignoresSafeArea())
    }
}
