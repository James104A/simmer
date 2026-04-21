import SwiftUI

struct FilterSheet: View {
    @Binding var filters: RecipeFilters
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("Favorites only", isOn: $filters.favoritesOnly)
                    Picker("Minimum rating", selection: $filters.minRating) {
                        Text("Any").tag(0)
                        ForEach(1...5, id: \.self) { Text(String(repeating: "⭐️", count: $0)).tag($0) }
                    }
                    Picker("Total time", selection: $filters.timeFilter) {
                        Text("Any").tag(TimeFilter?.none)
                        ForEach(TimeFilter.all) { Text($0.label).tag(Optional($0)) }
                    }
                }

                tagSection("Season", options: TagOptions.seasons, selected: $filters.seasons)
                tagSection("Dish type", options: TagOptions.dishTypes, selected: $filters.dishTypes)
                tagSection("Cuisine", options: TagOptions.cuisines, selected: $filters.cuisines)
                tagSection("Occasion", options: TagOptions.goodFor, selected: $filters.goodFor)
                tagSection("Dietary", options: TagOptions.dietary, selected: $filters.dietary)
                tagSection("Protein", options: TagOptions.proteins, selected: $filters.proteins)
            }
            .navigationTitle("Filters")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") { filters.reset() }
                        .disabled(!filters.isActive)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
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
}

/// Simple flow layout for tag grids. SwiftUI doesn't ship one by default,
/// but the new iOS 16+ Layout protocol makes this a dozen lines.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var rowWidth: CGFloat = 0
        var totalHeight: CGFloat = 0
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if rowWidth + size.width > width {
                totalHeight += rowHeight + spacing
                rowWidth = size.width + spacing
                rowHeight = size.height
            } else {
                rowWidth += size.width + spacing
                rowHeight = max(rowHeight, size.height)
            }
        }
        totalHeight += rowHeight
        return CGSize(width: width, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
