import SwiftUI

struct BlocksView: View {
    @State private var blocks: [Block] = []
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        List {
            if blocks.isEmpty && !isLoading {
                ContentUnavailableView(
                    "No blocked users",
                    systemImage: "hand.raised",
                    description: Text("People you block won't see your activity or be able to send you requests.")
                )
                .listRowBackground(Color.clear)
            } else {
                ForEach(blocks) { block in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(block.blocked.name).font(.callout)
                            Text(block.blocked.email).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button("Unblock") {
                            Task { await unblock(block.blocked.id) }
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
        .navigationTitle("Blocked users")
        .refreshable { await load() }
        .task { await load() }
        .overlay {
            if isLoading && blocks.isEmpty { ProgressView() }
        }
        .alert("Error", isPresented: Binding(
            get: { error != nil },
            set: { if !$0 { error = nil } }
        )) {
            Button("OK") { error = nil }
        } message: {
            Text(error ?? "")
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            blocks = try await APIClient.shared.fetchBlocks()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func unblock(_ userId: String) async {
        do {
            try await APIClient.shared.unblockUser(userId: userId)
            Analytics.shared.track("moderation.unblock")
            await load()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

/// Reusable report sheet, presented anywhere UGC appears (recipe, user, feed event).
struct ReportSheet: View {
    @Environment(\.dismiss) private var dismiss
    let targetType: ReportTargetType
    let targetId: String
    let onSubmitted: () -> Void

    @State private var reason: ReportReason = .inappropriate
    @State private var details = ""
    @State private var isSubmitting = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Why are you reporting this?") {
                    Picker("Reason", selection: $reason) {
                        ForEach(ReportReason.allCases, id: \.self) { r in
                            Text(r.label).tag(r)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }
                Section("Additional details (optional)") {
                    TextField("Tell us more", text: $details, axis: .vertical)
                        .lineLimit(3...8)
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Report")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit", action: submit)
                        .disabled(isSubmitting)
                }
            }
        }
    }

    private func submit() {
        isSubmitting = true
        error = nil
        Task {
            defer { isSubmitting = false }
            do {
                try await APIClient.shared.report(
                    targetType: targetType,
                    targetId: targetId,
                    reason: reason,
                    details: details.isEmpty ? nil : details
                )
                Analytics.shared.track("moderation.report", [
                    "targetType": targetType.rawValue,
                    "reason": reason.rawValue,
                ])
                onSubmitted()
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
