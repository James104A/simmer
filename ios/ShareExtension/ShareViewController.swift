import UIKit
import Social
import UniformTypeIdentifiers
import OSLog

/// Invoked when a user taps Share → Simmer in Safari or other apps. Extracts
/// a URL from the share payload, calls /api/recipes/summarize, then
/// POST /api/recipes to save. Stays under Apple's 60s extension budget by
/// handing the user a success screen immediately after the recipe is saved.
final class ShareViewController: UIViewController {
    private let logger = Logger(subsystem: "com.simmer.app.ShareExtension", category: "Share")

    private let card = UIView()
    private let titleLabel = UILabel()
    private let subtitleLabel = UILabel()
    private let spinner = UIActivityIndicatorView(style: .medium)
    private let dismissButton = UIButton(type: .system)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black.withAlphaComponent(0.35)
        setupCard()
        extractAndProcess()
    }

    private func setupCard() {
        card.translatesAutoresizingMaskIntoConstraints = false
        card.backgroundColor = .systemBackground
        card.layer.cornerRadius = 16
        card.layer.cornerCurve = .continuous
        view.addSubview(card)
        NSLayoutConstraint.activate([
            card.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            card.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            card.widthAnchor.constraint(equalToConstant: 280),
        ])

        let stack = UIStackView(arrangedSubviews: [spinner, titleLabel, subtitleLabel, dismissButton])
        stack.axis = .vertical
        stack.spacing = 12
        stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 20),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -16),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
        ])

        titleLabel.font = .systemFont(ofSize: 18, weight: .semibold)
        titleLabel.textAlignment = .center
        subtitleLabel.font = .systemFont(ofSize: 14)
        subtitleLabel.textColor = .secondaryLabel
        subtitleLabel.textAlignment = .center
        subtitleLabel.numberOfLines = 0

        dismissButton.setTitle("Done", for: .normal)
        dismissButton.addTarget(self, action: #selector(close), for: .touchUpInside)
        dismissButton.isHidden = true

        spinner.startAnimating()
        titleLabel.text = "Saving to Simmer…"
        subtitleLabel.text = nil
    }

    private func extractAndProcess() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            show(error: "Nothing to share.")
            return
        }

        Task {
            for item in items {
                guard let providers = item.attachments else { continue }
                for provider in providers {
                    if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                        if let data = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier),
                           let url = data as? URL {
                            await process(url: url.absoluteString)
                            return
                        }
                    }
                    if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                        if let data = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier),
                           let text = data as? String,
                           let url = extractURL(from: text) {
                            await process(url: url)
                            return
                        }
                    }
                }
            }
            await MainActor.run { self.show(error: "Couldn't find a URL to save.") }
        }
    }

    private func extractURL(from text: String) -> String? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let range = NSRange(location: 0, length: text.utf16.count)
        return detector?.matches(in: text, range: range).first?.url?.absoluteString
    }

    @MainActor
    private func process(url: String) async {
        guard let token = SharedKeychain.getSessionToken() else {
            show(error: "Open Simmer and sign in first, then try sharing again.")
            return
        }
        do {
            let summary = try await summarize(url: url, token: token)
            try await createRecipe(summary: summary, url: url, token: token)
            show(success: "Recipe saved. Open Simmer to view it.")
        } catch {
            logger.error("Share save failed: \(error.localizedDescription)")
            show(error: error.localizedDescription)
        }
    }

    private func summarize(url: String, token: String) async throws -> SummaryPayload {
        var req = URLRequest(url: SharedConfig.apiBaseURL.appendingPathComponent("/api/recipes/summarize"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONEncoder().encode(["url": url])
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NSError(
                domain: "Share", code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Couldn't extract the recipe."]
            )
        }
        return try JSONDecoder().decode(SummaryPayload.self, from: data)
    }

    private func createRecipe(summary: SummaryPayload, url: String, token: String) async throws {
        var body: [String: Any] = [
            "title": summary.title ?? URL(string: url)?.host ?? "Saved recipe",
            "recipeType": "linked",
            "url": url,
        ]
        if let d = summary.descriptionShort { body["descriptionShort"] = d }
        if let h = summary.highlights, !h.isEmpty { body["highlights"] = h }
        if let i = summary.ingredients, !i.isEmpty { body["ingredients"] = i }
        if let s = summary.steps, !s.isEmpty { body["steps"] = s }
        if let img = summary.imageUrl { body["imageUrl"] = img }
        if let pt = summary.prepTimeMinutes { body["prepTimeMinutes"] = pt }
        if let ct = summary.cookTimeMinutes { body["cookTimeMinutes"] = ct }
        if let sv = summary.servings { body["servings"] = sv }

        var req = URLRequest(url: SharedConfig.apiBaseURL.appendingPathComponent("/api/recipes"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (_, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NSError(domain: "Share", code: 2,
                          userInfo: [NSLocalizedDescriptionKey: "Couldn't save the recipe."])
        }
    }

    @MainActor
    private func show(success message: String) {
        spinner.stopAnimating()
        titleLabel.text = "Saved ✓"
        subtitleLabel.text = message
        dismissButton.isHidden = false
        // Auto-close after a short delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.close() }
    }

    @MainActor
    private func show(error message: String) {
        spinner.stopAnimating()
        titleLabel.text = "Couldn't save"
        subtitleLabel.text = message
        dismissButton.isHidden = false
    }

    @objc
    private func close() {
        extensionContext?.completeRequest(returningItems: nil)
    }
}

struct SummaryPayload: Decodable {
    let title: String?
    let descriptionShort: String?
    let highlights: [String]?
    let ingredients: [String]?
    let steps: [String]?
    let prepTimeMinutes: Int?
    let cookTimeMinutes: Int?
    let servings: String?
    let imageUrl: String?
}
