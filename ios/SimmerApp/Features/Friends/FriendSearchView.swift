import SwiftUI

struct FriendSearchView: View {
    @Environment(\.dismiss) private var dismiss
    var onInvited: () -> Void

    @State private var query = ""
    @State private var results: [Friend] = []
    @State private var invited: Set<String> = []
    @State private var error: String?
    @State private var isLoading = false
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        NavigationStack {
            List {
                if results.isEmpty && !query.isEmpty && !isLoading {
                    ContentUnavailableView(
                        "No matches",
                        systemImage: "magnifyingglass",
                        description: Text("Try a different name or email.")
                    )
                    .listRowBackground(Color.clear)
                }
                ForEach(results) { user in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(user.name).font(.callout.bold())
                            Text(user.email).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if invited.contains(user.id) {
                            Text("Sent").foregroundStyle(.secondary)
                        } else {
                            Button("Add") { Task { await invite(user) } }
                                .buttonStyle(.borderedProminent)
                                .tint(Color("BrandOrange"))
                        }
                    }
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .searchable(text: $query, prompt: "Search by name or email")
            .onChange(of: query) { _, newValue in
                searchTask?.cancel()
                searchTask = Task {
                    try? await Task.sleep(for: .milliseconds(300))
                    guard !Task.isCancelled else { return }
                    await search(query: newValue)
                }
            }
            .navigationTitle("Add friends")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .overlay {
                if isLoading && results.isEmpty { ProgressView() }
            }
        }
    }

    private func search(query: String) async {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard trimmed.count >= 2 else { results = []; return }
        isLoading = true
        defer { isLoading = false }
        do {
            results = try await APIClient.shared.searchUsers(query: trimmed)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func invite(_ user: Friend) async {
        do {
            try await APIClient.shared.sendFriendRequest(email: user.email)
            invited.insert(user.id)
            Analytics.shared.track("friends.invite")
            onInvited()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
