import Foundation

/// Mirrors the Recipe Prisma model. JSON-array fields are stored as JSON strings
/// server-side and flattened to [String] here for ergonomics.
struct Recipe: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let userId: String
    var title: String
    var recipeType: RecipeType
    var url: String?
    var imageUrl: String?
    var descriptionShort: String?
    var highlights: [String]
    var ingredients: [String]
    var steps: [String]
    var personalNotes: String?
    var seasonTags: [String]
    var dishTypes: [String]
    var cuisineTypes: [String]
    var goodForTags: [String]
    var dietaryTags: [String]
    var mainIngredientTags: [String]
    var prepTimeMinutes: Int?
    var cookTimeMinutes: Int?
    var totalTimeMinutes: Int?
    var servings: String?
    var rating: Int?
    var isFavorite: Bool
    var cookCount: Int
    var lastCookedAt: Date?
    let createdAt: Date
    let updatedAt: Date
    var user: AuthorRef?

    struct AuthorRef: Codable, Hashable, Sendable {
        let id: String
        let name: String
    }

    enum CodingKeys: String, CodingKey {
        case id, userId, title, recipeType, url, imageUrl, descriptionShort
        case highlights, ingredients, steps, personalNotes
        case seasonTags, dishTypes, cuisineTypes, goodForTags, dietaryTags
        case mainIngredientTags
        case prepTimeMinutes, cookTimeMinutes, totalTimeMinutes, servings
        case rating, isFavorite, cookCount, lastCookedAt
        case createdAt, updatedAt, user
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        userId = try c.decode(String.self, forKey: .userId)
        title = try c.decode(String.self, forKey: .title)
        recipeType = try c.decode(RecipeType.self, forKey: .recipeType)
        url = try c.decodeIfPresent(String.self, forKey: .url)
        imageUrl = try c.decodeIfPresent(String.self, forKey: .imageUrl)
        descriptionShort = try c.decodeIfPresent(String.self, forKey: .descriptionShort)
        highlights = Recipe.decodeJSONArray(c, key: .highlights)
        ingredients = Recipe.decodeJSONArray(c, key: .ingredients)
        steps = Recipe.decodeJSONArray(c, key: .steps)
        personalNotes = try c.decodeIfPresent(String.self, forKey: .personalNotes)
        seasonTags = Recipe.decodeJSONArray(c, key: .seasonTags)
        dishTypes = Recipe.decodeJSONArray(c, key: .dishTypes)
        cuisineTypes = Recipe.decodeJSONArray(c, key: .cuisineTypes)
        goodForTags = Recipe.decodeJSONArray(c, key: .goodForTags)
        dietaryTags = Recipe.decodeJSONArray(c, key: .dietaryTags)
        mainIngredientTags = Recipe.decodeJSONArray(c, key: .mainIngredientTags)
        prepTimeMinutes = try c.decodeIfPresent(Int.self, forKey: .prepTimeMinutes)
        cookTimeMinutes = try c.decodeIfPresent(Int.self, forKey: .cookTimeMinutes)
        totalTimeMinutes = try c.decodeIfPresent(Int.self, forKey: .totalTimeMinutes)
        servings = try c.decodeIfPresent(String.self, forKey: .servings)
        rating = try c.decodeIfPresent(Int.self, forKey: .rating)
        isFavorite = try c.decodeIfPresent(Bool.self, forKey: .isFavorite) ?? false
        cookCount = try c.decodeIfPresent(Int.self, forKey: .cookCount) ?? 0
        lastCookedAt = try c.decodeIfPresent(Date.self, forKey: .lastCookedAt)
        createdAt = try c.decode(Date.self, forKey: .createdAt)
        updatedAt = try c.decode(Date.self, forKey: .updatedAt)
        user = try c.decodeIfPresent(AuthorRef.self, forKey: .user)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(userId, forKey: .userId)
        try c.encode(title, forKey: .title)
        try c.encode(recipeType, forKey: .recipeType)
        try c.encodeIfPresent(url, forKey: .url)
        try c.encodeIfPresent(imageUrl, forKey: .imageUrl)
        try c.encodeIfPresent(descriptionShort, forKey: .descriptionShort)
        try Recipe.encodeJSONArray(highlights, into: &c, key: .highlights)
        try Recipe.encodeJSONArray(ingredients, into: &c, key: .ingredients)
        try Recipe.encodeJSONArray(steps, into: &c, key: .steps)
        try c.encodeIfPresent(personalNotes, forKey: .personalNotes)
        try Recipe.encodeJSONArray(seasonTags, into: &c, key: .seasonTags)
        try Recipe.encodeJSONArray(dishTypes, into: &c, key: .dishTypes)
        try Recipe.encodeJSONArray(cuisineTypes, into: &c, key: .cuisineTypes)
        try Recipe.encodeJSONArray(goodForTags, into: &c, key: .goodForTags)
        try Recipe.encodeJSONArray(dietaryTags, into: &c, key: .dietaryTags)
        try Recipe.encodeJSONArray(mainIngredientTags, into: &c, key: .mainIngredientTags)
        try c.encodeIfPresent(prepTimeMinutes, forKey: .prepTimeMinutes)
        try c.encodeIfPresent(cookTimeMinutes, forKey: .cookTimeMinutes)
        try c.encodeIfPresent(totalTimeMinutes, forKey: .totalTimeMinutes)
        try c.encodeIfPresent(servings, forKey: .servings)
        try c.encodeIfPresent(rating, forKey: .rating)
        try c.encode(isFavorite, forKey: .isFavorite)
        try c.encode(cookCount, forKey: .cookCount)
        try c.encodeIfPresent(lastCookedAt, forKey: .lastCookedAt)
        try c.encode(createdAt, forKey: .createdAt)
        try c.encode(updatedAt, forKey: .updatedAt)
        try c.encodeIfPresent(user, forKey: .user)
    }

    private static func decodeJSONArray(
        _ container: KeyedDecodingContainer<CodingKeys>,
        key: CodingKeys
    ) -> [String] {
        guard let raw = try? container.decodeIfPresent(String.self, forKey: key),
              let data = raw.data(using: .utf8),
              let array = try? JSONDecoder().decode([String].self, from: data)
        else { return [] }
        return array
    }

    private static func encodeJSONArray(
        _ value: [String],
        into container: inout KeyedEncodingContainer<CodingKeys>,
        key: CodingKeys
    ) throws {
        guard !value.isEmpty else {
            try container.encodeNil(forKey: key)
            return
        }
        let data = try JSONEncoder().encode(value)
        if let string = String(data: data, encoding: .utf8) {
            try container.encode(string, forKey: key)
        }
    }
}

enum RecipeType: String, Codable, CaseIterable, Sendable {
    case linked
    case native
}

/// Shape of the `/api/recipes/summarize` response. Fields are optional because
/// sites vary; merge into a RecipeDraft when populating the form.
struct SummarizeResponse: Codable, Sendable {
    let title: String?
    let descriptionShort: String?
    let highlights: [String]?
    let ingredients: [String]?
    let steps: [String]?
    let prepTimeMinutes: Int?
    let cookTimeMinutes: Int?
    let servings: String?
    let imageUrl: String?
    let sourceUrl: String?
    let method: String?
}

struct CookLog: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let recipeId: String
    let userId: String
    let cookedAt: Date
    let notes: String?
    let createdAt: Date
}
