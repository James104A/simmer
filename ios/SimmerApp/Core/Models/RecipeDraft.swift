import Foundation

/// Payload for POST /api/recipes. The server JSON-stringifies array fields
/// on insert, so on the wire we send them as arrays (Next.js route handles
/// both but cleaner to let the server do the stringification).
struct RecipeDraft: Codable {
    var title: String
    var recipeType: RecipeType
    var url: String?
    var imageUrl: String?
    var descriptionShort: String?
    var highlights: [String]?
    var ingredients: [String]?
    var steps: [String]?
    var personalNotes: String?
    var seasonTags: [String]?
    var dishTypes: [String]?
    var cuisineTypes: [String]?
    var goodForTags: [String]?
    var dietaryTags: [String]?
    var mainIngredientTags: [String]?
    var prepTimeMinutes: Int?
    var cookTimeMinutes: Int?
    var totalTimeMinutes: Int?
    var servings: String?

    static func blank(_ type: RecipeType) -> RecipeDraft {
        RecipeDraft(title: "", recipeType: type)
    }
}

/// PATCH /api/recipes/:id payload. Any non-nil field is updated; nil is ignored
/// (the server does a straight spread into Prisma.update).
struct RecipePatch: Codable {
    var title: String?
    var url: String?
    var imageUrl: String?
    var descriptionShort: String?
    var highlights: String?
    var ingredients: String?
    var steps: String?
    var personalNotes: String?
    var seasonTags: String?
    var dishTypes: String?
    var cuisineTypes: String?
    var goodForTags: String?
    var dietaryTags: String?
    var mainIngredientTags: String?
    var prepTimeMinutes: Int?
    var cookTimeMinutes: Int?
    var totalTimeMinutes: Int?
    var servings: String?
    var rating: Int?
    var isFavorite: Bool?

    static func favorite(_ isFavorite: Bool) -> RecipePatch {
        var p = RecipePatch()
        p.isFavorite = isFavorite
        return p
    }

    static func rating(_ value: Int?) -> RecipePatch {
        var p = RecipePatch()
        p.rating = value
        return p
    }

    static func personalNotes(_ notes: String?) -> RecipePatch {
        var p = RecipePatch()
        p.personalNotes = notes
        return p
    }

    /// Encode an array of strings to the JSON-stringified form Prisma expects.
    static func tagsArrayToJSON(_ tags: [String]?) -> String? {
        guard let tags, !tags.isEmpty else { return nil }
        guard let data = try? JSONEncoder().encode(tags),
              let s = String(data: data, encoding: .utf8)
        else { return nil }
        return s
    }
}
