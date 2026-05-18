import XCTest
@testable import Simmer

final class RecipeDecodingTests: XCTestCase {
    func test_decodesJSONStringArrayFields() throws {
        let json = """
        {
            "id": "r1",
            "userId": "u1",
            "title": "Shakshuka",
            "recipeType": "linked",
            "ingredients": "[\\"Eggs\\",\\"Tomatoes\\"]",
            "steps": "[\\"Heat oil\\",\\"Add tomatoes\\"]",
            "cuisineTypes": "[\\"Mediterranean\\"]",
            "isFavorite": true,
            "cookCount": 3,
            "createdAt": "2026-04-01T12:00:00Z",
            "updatedAt": "2026-04-01T12:00:00Z"
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let recipe = try decoder.decode(Recipe.self, from: json)

        XCTAssertEqual(recipe.title, "Shakshuka")
        XCTAssertEqual(recipe.ingredients, ["Eggs", "Tomatoes"])
        XCTAssertEqual(recipe.steps.count, 2)
        XCTAssertEqual(recipe.cuisineTypes, ["Mediterranean"])
        XCTAssertTrue(recipe.isFavorite)
        XCTAssertEqual(recipe.cookCount, 3)
    }

    func test_handlesMissingArrayFields() throws {
        let json = """
        {
            "id": "r1",
            "userId": "u1",
            "title": "Plain",
            "recipeType": "native",
            "isFavorite": false,
            "cookCount": 0,
            "createdAt": "2026-04-01T12:00:00Z",
            "updatedAt": "2026-04-01T12:00:00Z"
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let recipe = try decoder.decode(Recipe.self, from: json)

        XCTAssertEqual(recipe.ingredients, [])
        XCTAssertEqual(recipe.steps, [])
        XCTAssertEqual(recipe.cuisineTypes, [])
    }
}

final class FilterTests: XCTestCase {
    func test_favoritesOnlyFiltersNonFavorites() throws {
        let a = try sample(id: "a", favorite: true)
        let b = try sample(id: "b", favorite: false)
        var filters = RecipeFilters()
        filters.favoritesOnly = true
        let result = filters.apply(to: [a, b])
        XCTAssertEqual(result.map(\.id), ["a"])
    }

    func test_timeFilterAppliesTotalTime() throws {
        let quick = try sample(id: "q", total: 20)
        let slow = try sample(id: "s", total: 90)
        var filters = RecipeFilters()
        filters.timeFilter = TimeFilter.all[0] // under 30
        XCTAssertEqual(filters.apply(to: [quick, slow]).map(\.id), ["q"])
    }

    private func sample(id: String, favorite: Bool = false, total: Int? = nil) throws -> Recipe {
        let base = """
        {
            "id": "\(id)",
            "userId": "u",
            "title": "t",
            "recipeType": "native",
            "isFavorite": \(favorite),
            "cookCount": 0,
            "createdAt": "2026-04-01T12:00:00Z",
            "updatedAt": "2026-04-01T12:00:00Z"
            \(total.map { ", \"totalTimeMinutes\": \($0)" } ?? "")
        }
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Recipe.self, from: base)
    }
}

final class URLRouterTests: XCTestCase {
    func test_routesFeedDeepLink() {
        let url = URL(string: "simmer://feed")!
        XCTAssertEqual(URLRouter.route(url), .feed)
    }

    func test_routesRecipeDeepLink() {
        let url = URL(string: "simmer://recipes/abc123")!
        if case .recipe(let id) = URLRouter.route(url) {
            XCTAssertEqual(id, "abc123")
        } else {
            XCTFail("Expected recipe deep link")
        }
    }

    func test_rejectsUnknownPath() {
        let url = URL(string: "simmer://gibberish")!
        XCTAssertNil(URLRouter.route(url))
    }
}
