import SwiftUI

struct OnboardingView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var step = 0

    private let steps: [Step] = [
        Step(
            icon: "sparkles",
            title: "Welcome to Simmer",
            subtitle: "Your shared recipe library",
            body: "Simmer keeps track of recipes you love, lets you see what your friends are cooking, and builds a shared kitchen with the people you cook with."
        ),
        Step(
            icon: "link",
            title: "Save recipes from anywhere",
            subtitle: "Paste a link, let AI do the rest",
            body: "Tap + Add and paste any recipe URL. Simmer pulls the ingredients, steps, and photo for you — or share a recipe to Simmer directly from Safari."
        ),
        Step(
            icon: "person.2.fill",
            title: "Cook with friends & your partner",
            subtitle: "Share your kitchen digitally",
            body: "Pair with your partner to share one recipe library. Add friends to see what they're cooking and save their recipes to your own want-to-try list."
        ),
        Step(
            icon: "square.stack.3d.up.fill",
            title: "Your feed",
            subtitle: "See what everyone's cooking",
            body: "The Feed shows activity from you and your friends: recipes added, dishes cooked, and new favorites discovered."
        ),
    ]

    struct Step {
        let icon: String
        let title: String
        let subtitle: String
        let body: String
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                ForEach(steps.indices, id: \.self) { i in
                    Capsule()
                        .fill(i == step ? Color("BrandOrange") : Color.secondary.opacity(0.3))
                        .frame(width: i == step ? 28 : 14, height: 4)
                        .animation(.snappy, value: step)
                }
            }
            .padding(.vertical, 24)

            Image(systemName: steps[step].icon)
                .font(.system(size: 54, weight: .semibold))
                .foregroundStyle(Color("BrandOrange"))
                .padding(.bottom, 20)

            Text(steps[step].title)
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            Text(steps[step].subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.top, 4)

            Text(steps[step].body)
                .multilineTextAlignment(.center)
                .padding(.top, 20)
                .padding(.horizontal, 24)

            Spacer()

            HStack {
                if step > 0 {
                    Button("Back") { withAnimation { step -= 1 } }
                        .buttonStyle(.bordered)
                } else {
                    Button("Skip") { finish() }
                        .buttonStyle(.plain)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(step == steps.count - 1 ? "Let's cook" : "Next") {
                    if step == steps.count - 1 { finish() }
                    else { withAnimation { step += 1 } }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color("BrandOrange"))
            }
            .padding(24)
        }
        .padding(.top, 40)
        .background(Color("BrandCream").ignoresSafeArea())
    }

    private func finish() {
        Analytics.shared.track("onboarding.complete", ["step": String(step)])
        appState.markOnboardingComplete()
        dismiss()
    }
}
