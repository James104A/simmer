import SwiftUI
import UIKit

struct RecipeDetailView: View {
    let recipeId: String
    var onUpdated: (Recipe) -> Void = { _ in }

    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var recipe: Recipe?
    @State private var isLoading = false
    @State private var error: String?
    @State private var showCookSheet = false
    @State private var showEdit = false
    @State private var showReport = false
    @State private var keepScreenOn = false

    var body: some View {
        ScrollView {
            if let recipe {
                detail(recipe)
            } else if isLoading {
                ProgressView().padding(40)
            } else if let error {
                ErrorBanner(message: error) { Task { await load() } }
                    .padding()
            }
        }
        .navigationTitle(recipe?.title ?? "")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let recipe {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            Task { await toggleFavorite(recipe) }
                        } label: {
                            Label(
                                recipe.isFavorite ? "Unfavorite" : "Favorite",
                                systemImage: recipe.isFavorite ? "heart.slash" : "heart"
                            )
                        }
                        if recipe.userId == appState.currentUser?.id {
                            Button { showEdit = true } label: { Label("Edit", systemImage: "pencil") }
                        }
                        if let url = recipe.url, let u = URL(string: url) {
                            Link(destination: u) { Label("Open source", systemImage: "safari") }
                        }
                        if recipe.userId != appState.currentUser?.id {
                            Button(role: .destructive) { showReport = true } label: {
                                Label("Report", systemImage: "flag")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .task { await load() }
        .refreshable { await load() }
        .sheet(isPresented: $showCookSheet) {
            if let recipe {
                CookLogSheet(recipe: recipe) {
                    Task { await load() }
                }
            }
        }
        .sheet(isPresented: $showEdit) {
            if let recipe {
                RecipeFormView(mode: .edit(recipe)) { updated in
                    self.recipe = updated
                    onUpdated(updated)
                }
            }
        }
        .sheet(isPresented: $showReport) {
            ReportSheet(targetType: .recipe, targetId: recipeId) {}
        }
        .onChange(of: keepScreenOn) { _, on in
            UIApplication.shared.isIdleTimerDisabled = on
        }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }

    @ViewBuilder
    private func detail(_ recipe: Recipe) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            RecipeThumbnail(imageURL: recipe.imageUrl, title: recipe.title)
                .aspectRatio(4/3, contentMode: .fill)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .padding(.horizontal)

            VStack(alignment: .leading, spacing: 8) {
                Text(recipe.title).font(.title2.bold())
                if let desc = recipe.descriptionShort, !desc.isEmpty {
                    Text(desc).font(.callout).foregroundStyle(.secondary)
                }
                HStack(spacing: 8) {
                    if let t = recipe.totalTimeMinutes { TagChip(text: "\(t) min", systemImage: "clock") }
                    if let s = recipe.servings { TagChip(text: s, systemImage: "person.2") }
                    if recipe.cookCount > 0 { TagChip(text: "\(recipe.cookCount) cooked", systemImage: "flame", style: .accent) }
                }
            }
            .padding(.horizontal)

            tagStrip(recipe)

            HStack(spacing: 12) {
                Button {
                    showCookSheet = true
                } label: {
                    Label("Cook this", systemImage: "flame.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color("BrandOrange"))
                .controlSize(.large)

                if recipe.userId != appState.currentUser?.id {
                    Button {
                        Task { await saveToLibrary() }
                    } label: {
                        Label("Save", systemImage: "bookmark")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                }
            }
            .padding(.horizontal)

            Toggle(isOn: $keepScreenOn) {
                Label("Keep screen on while cooking", systemImage: "display")
            }
            .padding(.horizontal)

            if !recipe.ingredients.isEmpty {
                section("Ingredients") {
                    ForEach(recipe.ingredients, id: \.self) { ing in
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Circle().fill(Color("BrandOrange")).frame(width: 6, height: 6)
                            Text(ing)
                        }
                        .font(.callout)
                        .padding(.vertical, 2)
                    }
                }
            }

            if !recipe.steps.isEmpty {
                section("Steps") {
                    ForEach(Array(recipe.steps.enumerated()), id: \.offset) { idx, step in
                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            Text("\(idx + 1).").font(.callout.bold()).foregroundStyle(Color("BrandOrange"))
                            Text(step)
                        }
                        .font(.callout)
                        .padding(.vertical, 4)
                    }
                }
            }

            if let notes = recipe.personalNotes, !notes.isEmpty {
                section("Personal notes") {
                    Text(notes).font(.callout)
                }
            }

            if !recipe.highlights.isEmpty {
                section("Highlights") {
                    ForEach(recipe.highlights, id: \.self) { h in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "sparkles").foregroundStyle(Color("BrandOrange"))
                            Text(h).font(.callout)
                        }
                    }
                }
            }
        }
        .padding(.vertical)
    }

    private func tagStrip(_ recipe: Recipe) -> some View {
        let all = recipe.cuisineTypes + recipe.dishTypes + recipe.dietaryTags + recipe.goodForTags
        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(all, id: \.self) { tag in
                    TagChip(text: tag, style: .neutral)
                }
            }
            .padding(.horizontal)
        }
    }

    private func section<Content: View>(_ title: String, @ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            content()
        }
        .padding(.horizontal)
    }

    private func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            recipe = try await APIClient.shared.fetchRecipe(id: recipeId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func toggleFavorite(_ recipe: Recipe) async {
        do {
            let patch = RecipePatch.favorite(!recipe.isFavorite)
            let updated = try await APIClient.shared.updateRecipe(id: recipe.id, patch: patch)
            self.recipe = updated
            onUpdated(updated)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func saveToLibrary() async {
        do {
            try await APIClient.shared.saveRecipe(id: recipeId)
            Analytics.shared.track("recipe.save")
        } catch {
            self.error = error.localizedDescription
        }
    }
}
