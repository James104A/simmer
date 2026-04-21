import Foundation
import Observation

@MainActor
@Observable
final class RecipeLibraryModel {
    enum Scope: String, CaseIterable, Identifiable {
        case own = "Yours"
        case saved = "Saved"
        var id: String { rawValue }
    }

    var scope: Scope = .own
    var ownRecipes: [Recipe] = []
    var savedRecipes: [Recipe] = []
    var isLoading = false
    var error: String?

    var searchText: String = ""
    var filters = RecipeFilters()
    var sort: RecipeSort = .recent

    var visibleRecipes: [Recipe] {
        var list = scope == .own ? ownRecipes : savedRecipes
        let query = searchText.trimmingCharacters(in: .whitespaces).lowercased()
        if !query.isEmpty {
            list = list.filter { recipe in
                recipe.title.lowercased().contains(query)
                    || (recipe.descriptionShort?.lowercased().contains(query) ?? false)
                    || recipe.cuisineTypes.contains(where: { $0.lowercased().contains(query) })
                    || recipe.ingredients.contains(where: { $0.lowercased().contains(query) })
            }
        }
        list = filters.apply(to: list)
        switch sort {
        case .recent:
            list.sort { $0.createdAt > $1.createdAt }
        case .mostCooked:
            list.sort { $0.cookCount > $1.cookCount }
        case .highestRated:
            list.sort { ($0.rating ?? 0) > ($1.rating ?? 0) }
        case .prepTime:
            list.sort { ($0.totalTimeMinutes ?? .max) < ($1.totalTimeMinutes ?? .max) }
        }
        // Favorites float to the top within each sort.
        list.sort { $0.isFavorite && !$1.isFavorite }
        return list
    }

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }
        do {
            async let own = APIClient.shared.fetchRecipes()
            async let saved = APIClient.shared.fetchSaved()
            self.ownRecipes = try await own
            self.savedRecipes = try await saved
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggleFavorite(_ recipe: Recipe) async {
        await updateRecipeLocally(recipe.id) { $0.isFavorite.toggle() }
        do {
            let patch = RecipePatch.favorite(!recipe.isFavorite)
            _ = try await APIClient.shared.updateRecipe(id: recipe.id, patch: patch)
            Analytics.shared.track("recipe.favorite.toggle", ["value": String(!recipe.isFavorite)])
        } catch {
            // Revert on failure
            await updateRecipeLocally(recipe.id) { $0.isFavorite = recipe.isFavorite }
            self.error = error.localizedDescription
        }
    }

    func delete(_ recipe: Recipe) async {
        do {
            try await APIClient.shared.deleteRecipe(id: recipe.id)
            ownRecipes.removeAll { $0.id == recipe.id }
            savedRecipes.removeAll { $0.id == recipe.id }
            Analytics.shared.track("recipe.delete")
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func updateRecipeLocally(_ id: String, _ mutate: (inout Recipe) -> Void) {
        if let idx = ownRecipes.firstIndex(where: { $0.id == id }) {
            mutate(&ownRecipes[idx])
        }
        if let idx = savedRecipes.firstIndex(where: { $0.id == id }) {
            mutate(&savedRecipes[idx])
        }
    }
}

struct RecipeFilters: Equatable {
    var seasons: Set<String> = []
    var dishTypes: Set<String> = []
    var cuisines: Set<String> = []
    var goodFor: Set<String> = []
    var dietary: Set<String> = []
    var proteins: Set<String> = []
    var timeFilter: TimeFilter?
    var minRating: Int = 0
    var favoritesOnly = false

    var isActive: Bool {
        !seasons.isEmpty || !dishTypes.isEmpty || !cuisines.isEmpty
            || !goodFor.isEmpty || !dietary.isEmpty || !proteins.isEmpty
            || timeFilter != nil || minRating > 0 || favoritesOnly
    }

    func apply(to recipes: [Recipe]) -> [Recipe] {
        recipes.filter { r in
            if favoritesOnly && !r.isFavorite { return false }
            if minRating > 0 && (r.rating ?? 0) < minRating { return false }
            if let tf = timeFilter {
                let t = r.totalTimeMinutes ?? ((r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0))
                if t == 0 { return false }
                if let min = tf.min, t < min { return false }
                if let max = tf.max, t > max { return false }
            }
            if !seasons.isEmpty && seasons.intersection(r.seasonTags).isEmpty { return false }
            if !dishTypes.isEmpty && dishTypes.intersection(r.dishTypes).isEmpty { return false }
            if !cuisines.isEmpty && cuisines.intersection(r.cuisineTypes).isEmpty { return false }
            if !goodFor.isEmpty && goodFor.intersection(r.goodForTags).isEmpty { return false }
            if !dietary.isEmpty && !dietary.isSubset(of: r.dietaryTags) { return false }
            if !proteins.isEmpty && proteins.intersection(r.mainIngredientTags).isEmpty { return false }
            return true
        }
    }

    mutating func reset() { self = RecipeFilters() }
}
