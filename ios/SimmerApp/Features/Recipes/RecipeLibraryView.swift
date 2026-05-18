import SwiftUI

struct RecipeLibraryView: View {
    @State private var model = RecipeLibraryModel()
    @State private var showFilters = false
    @State private var showAddSheet = false

    private let gridColumns = [GridItem(.adaptive(minimum: 160), spacing: 12)]

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Recipes")
                .searchable(text: $model.searchText, prompt: "Search recipes")
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Menu {
                            Picker("Sort", selection: $model.sort) {
                                ForEach(RecipeSort.allCases) { Text($0.label).tag($0) }
                            }
                        } label: {
                            Image(systemName: "arrow.up.arrow.down")
                        }
                    }
                    ToolbarItem(placement: .principal) {
                        Picker("Scope", selection: $model.scope) {
                            ForEach(RecipeLibraryModel.Scope.allCases) { scope in
                                Text(scope.rawValue).tag(scope)
                            }
                        }
                        .pickerStyle(.segmented)
                        .frame(maxWidth: 220)
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        HStack {
                            Button {
                                showFilters = true
                            } label: {
                                Image(systemName: model.filters.isActive
                                      ? "line.3.horizontal.decrease.circle.fill"
                                      : "line.3.horizontal.decrease.circle")
                            }
                            Button { showAddSheet = true } label: {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundStyle(Color("BrandOrange"))
                            }
                        }
                    }
                }
                .sheet(isPresented: $showFilters) {
                    FilterSheet(filters: $model.filters)
                        .presentationDetents([.medium, .large])
                }
                .sheet(isPresented: $showAddSheet) {
                    RecipeFormView(mode: .create) { created in
                        model.ownRecipes.insert(created, at: 0)
                    }
                }
                .refreshable { await model.load() }
                .task { await model.load() }
        }
    }

    @ViewBuilder
    private var content: some View {
        if model.isLoading && model.visibleRecipes.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if model.visibleRecipes.isEmpty {
            EmptyStateView(
                systemImage: model.scope == .own ? "fork.knife" : "bookmark",
                title: model.scope == .own ? "No recipes yet" : "Nothing saved",
                message: model.scope == .own
                    ? "Add your first recipe from a URL or write one by hand."
                    : "Recipes you save from friends will show up here.",
                action: model.scope == .own ? ("Add recipe", { showAddSheet = true }) : nil
            )
        } else {
            ScrollView {
                if let error = model.error {
                    ErrorBanner(message: error) {
                        Task { await model.load() }
                    }
                    .padding()
                }
                LazyVGrid(columns: gridColumns, spacing: 12) {
                    ForEach(model.visibleRecipes) { recipe in
                        NavigationLink(value: recipe) {
                            RecipeCard(recipe: recipe)
                                .contextMenu {
                                    Button {
                                        Task { await model.toggleFavorite(recipe) }
                                    } label: {
                                        Label(
                                            recipe.isFavorite ? "Unfavorite" : "Favorite",
                                            systemImage: recipe.isFavorite ? "heart.slash" : "heart"
                                        )
                                    }
                                    if model.scope == .own {
                                        Button(role: .destructive) {
                                            Task { await model.delete(recipe) }
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    }
                                }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .navigationDestination(for: Recipe.self) { recipe in
                RecipeDetailView(recipeId: recipe.id) { updated in
                    if let idx = model.ownRecipes.firstIndex(where: { $0.id == updated.id }) {
                        model.ownRecipes[idx] = updated
                    }
                }
            }
        }
    }
}

struct RecipeCard: View {
    let recipe: Recipe

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RecipeThumbnail(imageURL: recipe.imageUrl, title: recipe.title)
                .aspectRatio(1, contentMode: .fill)
                .overlay(alignment: .topTrailing) {
                    if recipe.isFavorite {
                        Image(systemName: "heart.fill")
                            .foregroundStyle(.white)
                            .padding(6)
                            .background(.black.opacity(0.35), in: Circle())
                            .padding(6)
                    }
                }
            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.title).font(.callout.bold()).lineLimit(2)
                HStack(spacing: 6) {
                    if let t = recipe.totalTimeMinutes {
                        Label("\(t)m", systemImage: "clock")
                    }
                    if recipe.cookCount > 0 {
                        Label("\(recipe.cookCount)x", systemImage: "flame")
                    }
                    if let rating = recipe.rating, rating > 0 {
                        Label("\(rating)", systemImage: "star.fill")
                    }
                }
                .font(.caption2)
                .foregroundStyle(.secondary)
            }
        }
        .padding(8)
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
