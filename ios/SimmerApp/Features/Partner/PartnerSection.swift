import SwiftUI

struct PartnerSection: View {
    let partnership: Partnership?
    let requests: [PartnerRequest]
    let onChange: () async -> Void

    @State private var showInvite = false
    @State private var error: String?
    @State private var confirmUnlink = false

    var body: some View {
        Group {
            if let partnership {
                PartnerRow(
                    partnership: partnership,
                    onUnlink: { confirmUnlink = true }
                )
            } else if !requests.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(requests) { request in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(request.sender.name) invited you to share a cookbook")
                                .font(.callout)
                            HStack {
                                Button("Accept") {
                                    Task { await respond(request, action: .accept) }
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(Color("BrandOrange"))
                                Button("Decline") {
                                    Task { await respond(request, action: .decline) }
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }
                }
            } else {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("No partner yet").font(.callout)
                        Text("Pair with your partner to share a recipe library.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button("Invite") { showInvite = true }
                        .buttonStyle(.bordered)
                }
            }

            if let error {
                Text(error).foregroundStyle(.red).font(.caption)
            }
        }
        .sheet(isPresented: $showInvite) {
            PartnerInviteSheet(onInvited: { await onChange() })
        }
        .confirmationDialog(
            "Unlink from your partner?",
            isPresented: $confirmUnlink,
            titleVisibility: .visible
        ) {
            Button("Unlink", role: .destructive) { Task { await unlink() } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You'll each keep your own copy of the shared library.")
        }
    }

    private func respond(_ request: PartnerRequest, action: FriendRequestAction) async {
        do {
            try await APIClient.shared.respondToPartnerRequest(id: request.id, action: action)
            Analytics.shared.track("partner.request.\(action.rawValue)")
            await onChange()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func unlink() async {
        do {
            try await APIClient.shared.unlinkPartner()
            Analytics.shared.track("partner.unlink")
            await onChange()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private struct PartnerRow: View {
    let partnership: Partnership
    let onUnlink: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Image(systemName: "heart.fill").foregroundStyle(Color("BrandOrange"))
                    Text(partnership.partner.name).font(.callout.bold())
                }
                Text("You share a recipe library").font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Button("Unlink", role: .destructive, action: onUnlink)
                .buttonStyle(.bordered)
        }
    }
}

struct PartnerInviteSheet: View {
    @Environment(\.dismiss) private var dismiss
    var onInvited: () async -> Void

    @State private var email = ""
    @State private var isSending = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Invite your partner") {
                    TextField("Their email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
                Section {
                    Button {
                        Task { await send() }
                    } label: {
                        HStack {
                            Spacer()
                            if isSending { ProgressView() } else { Text("Send invite").bold() }
                            Spacer()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color("BrandOrange"))
                    .disabled(email.isEmpty || isSending)
                }
            }
            .navigationTitle("Partner")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func send() async {
        isSending = true
        error = nil
        defer { isSending = false }
        do {
            try await APIClient.shared.invitePartner(email: email)
            Analytics.shared.track("partner.invite")
            await onInvited()
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
