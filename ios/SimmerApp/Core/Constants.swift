import Foundation

enum TagOptions {
    static let seasons = ["Spring", "Summer", "Fall", "Winter", "Any"]
    static let dishTypes = [
        "Appetizer", "Main", "Side", "Dessert", "Snack",
        "Breakfast/Brunch", "Soup/Stew", "Salad", "Drink/Cocktail",
    ]
    static let cuisines = [
        "Italian", "Mexican", "Indian", "Thai", "American",
        "Mediterranean", "Japanese", "Chinese", "French", "Korean",
        "Middle Eastern", "Greek",
    ]
    static let goodFor = [
        "Weeknight", "Dinner Party", "Meal Prep", "Date Night",
        "Kid-Friendly", "Crowd/Potluck", "Healthy-ish", "Comfort Food",
    ]
    static let dietary = [
        "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free",
        "Nut-Free", "Low-Carb", "Paleo", "Whole30",
    ]
    static let proteins = [
        "Chicken", "Beef", "Pork", "Fish", "Shrimp",
        "Tofu", "Lamb", "Turkey", "Eggs",
    ]
}

struct TimeFilter: Hashable, Identifiable {
    let id: String
    let label: String
    let min: Int?
    let max: Int?

    static let all: [TimeFilter] = [
        .init(id: "u30", label: "Under 30 min", min: nil, max: 30),
        .init(id: "3060", label: "30–60 min", min: 30, max: 60),
        .init(id: "60p", label: "60+ min", min: 60, max: nil),
    ]
}

enum RecipeSort: String, CaseIterable, Identifiable {
    case recent
    case mostCooked
    case highestRated
    case prepTime

    var id: String { rawValue }

    var label: String {
        switch self {
        case .recent: return "Recently added"
        case .mostCooked: return "Most cooked"
        case .highestRated: return "Highest rated"
        case .prepTime: return "Prep time"
        }
    }
}
