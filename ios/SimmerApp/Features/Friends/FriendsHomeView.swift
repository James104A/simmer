import SwiftUI

struct FriendsHomeView: View {
    @State private var friends: [Friend] = []
    @State private var requests: [FriendRequest] = []
    @State private var partnership: Partnership?
    @State private var partnerRequests: [PartnerRequest] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var showSearch = false
    @State private var reportingUser: Friend?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    PartnerSection(
                        partnership: partnership,
                        requests: partnerRequests,
                        onChange: { await load() }
                    )
                } header: {
                    Text("Partner")
                }

                if !requests.isEmpty {
                    Section("Friend requests") {
                        ForEach(requests) { request in
                            FriendRequestRow(request: request) { await handleRequest(request, action: $0) }
                        }
                    }
                }

                Section("Friends") {
                    if friends.isEmpty {
                        ContentUnavailableView(
                            "No friends yet",
                            systemImage: "person.2",
                            description: Text("Add friends to see what they're cooking.")
                        )
                        .listRowBackground(Color.clear)
                    } else {
                        ForEach(friends) { friend in
                            HStack {
                                Text(friend.name)
                                Spacer()
                                Menu {
                                    Button(role: .destructive) {
                                        Task { await block(friend) }
                                    } label: {
                                        Label("Block user", systemImage: "hand.raised")
                                    }
                                    Button(role: .destructive) {
                                        reportingUser = friend
                                    } label: {
                                        Label("Report user", systemImage: "flag")
                                    }
                                } label: {
                                    Image(systemName: "ellipsis.circle")
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Friends")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { showSearch = true } label: {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
            .sheet(isPresented: $showSearch) {
                FriendSearchView { Task { await load() } }
            }
            .sheet(item: $reportingUser) { user in
                ReportSheet(targetType: .user, targetId: user.id) {}
            }
            .refreshable { await load() }
            .task { await load() }
            .alert("Error", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) {
                Button("OK") { error = nil }
            } message: { Text(error ?? "") }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let f = APIClient.shared.fetchFriends()
            async let r = APIClient.shared.fetchIncomingFriendRequests()
            async let p = APIClient.shared.fetchPartner()
            async let pr = APIClient.shared.fetchIncomingPartnerRequests()
            friends = try await f
            requests = try await r
            partnership = try await p
            partnerRequests = try await pr
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func handleRequest(_ request: FriendRequest, action: FriendRequestAction) async {
        do {
            try await APIClient.shared.respondToFriendRequest(id: request.id, action: action)
            Analytics.shared.track("friends.request.\(action.rawValue)")
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func block(_ friend: Friend) async {
        do {
            try await APIClient.shared.blockUser(userId: friend.id)
            Analytics.shared.track("moderation.block")
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct FriendRequestRow: View {
    let request: FriendRequest
    let onRespond: (FriendRequestAction) async -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(request.sender?.name ?? "Someone").font(.callout.bold())
                if let email = request.sender?.email {
                    Text(email).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            Button("Accept") { Task { await onRespond(.accept) } }
                .buttonStyle(.borderedProminent)
                .tint(Color("BrandOrange"))
            Button("Decline") { Task { await onRespond(.decline) } }
                .buttonStyle(.bordered)
        }
    }
}
