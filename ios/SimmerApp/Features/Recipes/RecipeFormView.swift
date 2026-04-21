import SwiftUI

struct RecipeFormView: View {
    enum Mode {
        case create
        case edit(Recipe)
    }

    let mode: Mode
    var onSaved: (Recipe) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var recipeType: RecipeType
    @State private var url = ""
    @State private var title = ""
    @State private var descriptionShort = ""
    @State private var personalNotes = ""
    @State private var ingredients: [String] = [""]
    @State private var steps: [String] = [""]
    @State private var prepTime: String = ""
    @State private var cookTime: String = ""
    @State private var servings: String = ""
    @State private var imageUrl: String?

    @State private var seasonTags: Set<String> = []
    @State private var dishTypes: Set<String> = []
    @State private var cuisines: Set<String> = []
    @State private var goodFor: Set<String> = []
    @State private var dietary: Set<String> = []
    @State private var proteins: Set<String> = []

    @State private var isSummarizing = false
    @State private var isSaving = false
    @State private var error: String?

    private var isEditing: Bool {
        if case .edit = mode { return true } else { return false }
    }

    private var existingId: String? {
        if case .edit(let r) = mode { return r.id } else { return nil }
    }

    init(mode: Mode, onSaved: @escaping (Recipe) -> Void) {
        self.mode = mode
        self.onSaved = onSaved
        switch mode {
        case .create:
            _recipeType = State(initialValue: .linked)
        case .edit(let r):
            _recipeType = State(initialValue: r.recipeType)
            _url = State(initialValue: r.url ?? "")
            _title = State(initialValue: r.title)
            _descriptionShort = State(initialValue: r.descriptionShort ?? "")
            _personalNotes = State(initialValue: r.personalNotes ?? "")
            _ingredients = State(initialValue: r.ingredients.isEmpty ? [""] : r.ingredients)
            _steps = State(initialValue: r.steps.isEmpty ? [""] : r.steps)
            _prepTime = State(initialValue: r.prepTimeMinutes.map(String.init) ?? "")
            _cookTime = State(initialValue: r.cookTimeMinutes.map(String.init) ?? "")
            _servings = State(initialValue: r.servings ?? "")
            _imageUrl = State(initialValue: r.imageUrl)
            _seasonTags = State(initialValue: Set(r.seasonTags))
            _dishTypes = State(initialValue: Set(r.dishTypes))
            _cuisines = State(initialValue: Set(r.cuisineTypes))
            _goodFor = State(initialValue: Set(r.goodForTags))
            _dietary = State(initialValue: Set(r.dietaryTags))
            _proteins = State(initialValue: Set(r.mainIngredientTags))
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                if !isEditing {
                    Picker("Type", selection: $recipeType) {
                        Text("From a URL").tag(RecipeType.linked)
                        Text("Write your own").tag(RecipeType.native)
                    }
                    .pickerStyle(.segmented)
                }

                if recipeType == .linked {
                    Section("Recipe URL") {
                        TextField("https://example.com/recipe", text: $url)
                            .textContentType(.URL)
                            .keyboardType(.URL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                        Button {
                            Task { await summarize() }
                        } label: {
                            HStack {
                                if isSummarizing { ProgressView() }
                                Text(isSummarizing ? "Analyzing…" : "Auto-fill from URL")
                            }
                        }
                        .disabled(url.isEmpty || isSummarizing)
                    }
                }

                Section("Details") {
                    TextField("Title", text: $title)
                    TextField("Short description", text: $descriptionShort, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section("Time & servings") {
                    HStack {
                        TextField("Prep (min)", text: $prepTime).keyboardType(.numberPad)
                        TextField("Cook (min)", text: $cookTime).keyboardType(.numberPad)
                    }
                    TextField("Servings", text: $servings)
                }

                Section("Ingredients") {
                    ForEach(ingredients.indices, id: \.self) { i in
                        TextField("Ingredient", text: $ingredients[i])
                    }
                    .onDelete { indices in ingredients.remove(atOffsets: indices) }
                    Button("Add ingredient") { ingredients.append("") }
                        .font(.callout)
                }

                Section("Steps") {
                    ForEach(steps.indices, id: \.self) { i in
                        TextField("Step \(i + 1)", text: $steps[i], axis: .vertical)
                            .lineLimit(1...5)
                    }
                    .onDelete { indices in steps.remove(atOffsets: indices) }
                    Button("Add step") { steps.append("") }
                        .font(.callout)
                }

                Section("Personal notes") {
                    TextField("Substitutions, tips, reminders…", text: $personalNotes, axis: .vertical)
                        .lineLimit(2...6)
                }

                tagSection("Season", options: TagOptions.seasons, selected: $seasonTags)
                tagSection("Dish type", options: TagOptions.dishTypes, selected: $dishTypes)
                tagSection("Cuisine", options: TagOptions.cuisines, selected: $cuisines)
                tagSection("Occasion", options: TagOptions.goodFor, selected: $goodFor)
                tagSection("Dietary", options: TagOptions.dietary, selected: $dietary)
                tagSection("Protein", options: TagOptions.proteins, selected: $proteins)

                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle(isEditing ? "Edit recipe" : "New recipe")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isEditing ? "Save" : "Add") { Task { await save() } }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                        .bold()
                }
            }
        }
    }

    private func tagSection(_ title: String, options: [String], selected: Binding<Set<String>>) -> some View {
        Section(title) {
            FlowLayout(spacing: 6) {
                ForEach(options, id: \.self) { option in
                    let isOn = selected.wrappedValue.contains(option)
                    Button {
                        if isOn { selected.wrappedValue.remove(option) }
                        else { selected.wrappedValue.insert(option) }
                    } label: {
                        Text(option)
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(isOn ? Color("BrandOrange") : Color.secondary.opacity(0.15))
                            .foregroundStyle(isOn ? .white : .primary)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func summarize() async {
        isSummarizing = true
        error = nil
        defer { isSummarizing = false }
        do {
            let result = try await APIClient.shared.summarizeURL(url)
            if let t = result.title, title.isEmpty { title = t }
            if let d = result.descriptionShort, descriptionShort.isEmpty { descriptionShort = d }
            if let ings = result.ingredients, !ings.isEmpty { ingredients = ings }
            if let sts = result.steps, !sts.isEmpty { steps = sts }
            if let pt = result.prepTimeMinutes, prepTime.isEmpty { prepTime = String(pt) }
            if let ct = result.cookTimeMinutes, cookTime.isEmpty { cookTime = String(ct) }
            if let s = result.servings, servings.isEmpty { servings = s }
            if let img = result.imageUrl { imageUrl = img }
            Analytics.shared.track("recipe.summarize", ["method": result.method ?? "unknown"])
        } catch {
            self.error = error.localizedDescription
            Analytics.shared.trackError("recipe.summarize", error: error)
        }
    }

    private func save() async {
        isSaving = true
        error = nil
        defer { isSaving = false }
        let cleanIngredients = ingredients.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        let cleanSteps = steps.map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        let prep = Int(prepTime)
        let cook = Int(cookTime)
        let total: Int? = (prep != nil || cook != nil) ? (prep ?? 0) + (cook ?? 0) : nil

        do {
            if let id = existingId {
                var patch = RecipePatch()
                patch.title = title
                patch.descriptionShort = descriptionShort.isEmpty ? nil : descriptionShort
                patch.personalNotes = personalNotes.isEmpty ? nil : personalNotes
                patch.ingredients = RecipePatch.tagsArrayToJSON(cleanIngredients)
                patch.steps = RecipePatch.tagsArrayToJSON(cleanSteps)
                patch.seasonTags = RecipePatch.tagsArrayToJSON(Array(seasonTags))
                patch.dishTypes = RecipePatch.tagsArrayToJSON(Array(dishTypes))
                patch.cuisineTypes = RecipePatch.tagsArrayToJSON(Array(cuisines))
                patch.goodForTags = RecipePatch.tagsArrayToJSON(Array(goodFor))
                patch.dietaryTags = RecipePatch.tagsArrayToJSON(Array(dietary))
                patch.mainIngredientTags = RecipePatch.tagsArrayToJSON(Array(proteins))
                patch.prepTimeMinutes = prep
                patch.cookTimeMinutes = cook
                patch.totalTimeMinutes = total
                patch.servings = servings.isEmpty ? nil : servings
                patch.url = url.isEmpty ? nil : url
                patch.imageUrl = imageUrl
                let updated = try await APIClient.shared.updateRecipe(id: id, patch: patch)
                Analytics.shared.track("recipe.update")
                onSaved(updated)
                dismiss()
            } else {
                var draft = RecipeDraft.blank(recipeType)
                draft.title = title
                draft.descriptionShort = descriptionShort.isEmpty ? nil : descriptionShort
                draft.personalNotes = personalNotes.isEmpty ? nil : personalNotes
                draft.ingredients = cleanIngredients
                draft.steps = cleanSteps
                draft.seasonTags = Array(seasonTags)
                draft.dishTypes = Array(dishTypes)
                draft.cuisineTypes = Array(cuisines)
                draft.goodForTags = Array(goodFor)
                draft.dietaryTags = Array(dietary)
                draft.mainIngredientTags = Array(proteins)
                draft.prepTimeMinutes = prep
                draft.cookTimeMinutes = cook
                draft.totalTimeMinutes = total
                draft.servings = servings.isEmpty ? nil : servings
                draft.url = url.isEmpty ? nil : url
                draft.imageUrl = imageUrl
                let created = try await APIClient.shared.createRecipe(draft)
                Analytics.shared.track("recipe.create", ["type": recipeType.rawValue])
                onSaved(created)
                dismiss()
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
