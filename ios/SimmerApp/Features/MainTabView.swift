import SwiftUI

struct MainTabView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedTab: Tab = .library

    enum Tab: Hashable {
        case library, feed, friends, settings
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            RecipeLibraryView()
                .tabItem { Label("Recipes", systemImage: "book.closed") }
                .tag(Tab.library)

            FeedView()
                .tabItem { Label("Feed", systemImage: "sparkles") }
                .tag(Tab.feed)

            FriendsHomeView()
                .tabItem { Label("Friends", systemImage: "person.2") }
                .tag(Tab.friends)

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gear") }
                .tag(Tab.settings)
        }
        .tint(Color("BrandOrange"))
        .task { await PushRegistrar.shared.requestAuthorizationIfNeeded() }
        .onChange(of: appState.pendingDeepLink) { _, link in
            guard let link else { return }
            switch link {
            case .feed: selectedTab = .feed
            case .friends: selectedTab = .friends
            case .partnerInvite: selectedTab = .friends
            case .recipe: selectedTab = .library
            }
            _ = appState.consumeDeepLink()
        }
    }
}
