import SwiftUI
import UIKit

struct CookLogSheet: View {
    let recipe: Recipe
    let onLogged: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var notes = ""
    @State private var favorite = false
    @State private var isSubmitting = false
    @State private var showDiscardConfirm = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Notes (optional)") {
                    TextField("How did it turn out?", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                Section {
                    Toggle("Mark as favorite", isOn: $favorite)
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
                Section {
                    Button(action: submit) {
                        HStack {
                            Spacer()
                            if isSubmitting { ProgressView() } else { Text("Log cook").bold() }
                            Spacer()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color("BrandOrange"))
                    .disabled(isSubmitting)

                    Button(role: .destructive) {
                        showDiscardConfirm = true
                    } label: {
                        Text("Didn't love it — discard")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .navigationTitle(recipe.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .confirmationDialog(
                "Discard this recipe?",
                isPresented: $showDiscardConfirm,
                titleVisibility: .visible
            ) {
                Button("Discard", role: .destructive) { Task { await discard() } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Marks this as a cook attempt and removes the recipe from your library.")
            }
        }
    }

    private func submit() {
        isSubmitting = true
        error = nil
        Task {
            defer { isSubmitting = false }
            do {
                try await APIClient.shared.logCook(
                    recipeId: recipe.id,
                    notes: notes.isEmpty ? nil : notes,
                    favorite: favorite
                )
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                Analytics.shared.track("cook.log", ["favorite": String(favorite)])
                onLogged()
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func discard() async {
        do {
            try await APIClient.shared.discardCook(recipeId: recipe.id)
            Analytics.shared.track("cook.discard")
            onLogged()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
