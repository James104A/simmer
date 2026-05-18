import SwiftUI

struct FeedView: View {
    @Environment(AppState.self) private var appState
    @State private var events: [FeedEvent] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var reportingEvent: FeedEvent?

    var body: some View {
        NavigationStack {
            Group {
                if events.isEmpty && !isLoading {
                    EmptyStateView(
                        systemImage: "sparkles",
                        title: "Your feed is quiet",
                        message: "Add friends to see what they're cooking.",
                        action: nil
                    )
                } else {
                    List {
                        if let error {
                            ErrorBanner(message: error) { Task { await load() } }
                                .listRowBackground(Color.clear)
                        }
                        ForEach(events) { event in
                            NavigationLink {
                                if let recipeId = event.recipe?.id {
                                    RecipeDetailView(recipeId: recipeId)
                                }
                            } label: {
                                FeedRow(event: event)
                            }
                            .swipeActions {
                                Button(role: .destructive) {
                                    reportingEvent = event
                                } label: {
                                    Label("Report", systemImage: "flag")
                                }
                                .tint(.orange)
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Feed")
            .refreshable { await load() }
            .task { await load() }
            .sheet(item: $reportingEvent) { event in
                ReportSheet(targetType: .feed_event, targetId: event.id) {}
            }
            .overlay {
                if isLoading && events.isEmpty { ProgressView() }
            }
        }
    }

    private func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            events = try await APIClient.shared.fetchFeed()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct FeedRow: View {
    let event: FeedEvent

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            RecipeThumbnail(imageURL: event.recipe?.imageUrl, title: event.recipe?.title ?? "")
                .frame(width: 56, height: 56)
            VStack(alignment: .leading, spacing: 4) {
                Text(header)
                    .font(.callout)
                if let recipe = event.recipe {
                    Text(recipe.title).font(.subheadline.bold())
                    if let desc = recipe.descriptionShort {
                        Text(desc).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                    }
                }
                Text(event.createdAt, style: .relative)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            eventIcon
        }
        .padding(.vertical, 4)
    }

    private var header: String {
        switch event.eventType {
        case "add_recipe": return "\(event.user.name) added a recipe"
        case "cook": return "\(event.user.name) cooked"
        case "cook_favorite": return "\(event.user.name) loved a cook"
        case "cook_discard": return "\(event.user.name) tried and discarded"
        case "save_recipe": return "\(event.user.name) saved a recipe"
        default: return event.user.name
        }
    }

    @ViewBuilder
    private var eventIcon: some View {
        switch event.eventType {
        case "add_recipe":
            Image(systemName: "book.fill").foregroundStyle(Color("BrandOrange"))
        case "cook_favorite":
            Image(systemName: "heart.fill").foregroundStyle(.pink)
        case "cook":
            Image(systemName: "flame.fill").foregroundStyle(.orange)
        case "cook_discard":
            Image(systemName: "hand.thumbsdown.fill").foregroundStyle(.gray)
        case "save_recipe":
            Image(systemName: "bookmark.fill").foregroundStyle(.blue)
        default:
            EmptyView()
        }
    }
}
