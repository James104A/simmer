import SwiftUI

/// Async image view that gracefully falls back to a title-based placeholder.
struct RecipeThumbnail: View {
    let imageURL: String?
    let title: String
    var cornerRadius: CGFloat = 12

    var body: some View {
        Group {
            if let imageURL, let url = URL(string: imageURL) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(contentMode: .fill)
                    case .empty:
                        placeholder(progress: true)
                    case .failure:
                        placeholder(progress: false)
                    @unknown default:
                        placeholder(progress: false)
                    }
                }
            } else {
                placeholder(progress: false)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }

    private func placeholder(progress: Bool) -> some View {
        ZStack {
            LinearGradient(
                colors: [Color("BrandOrange").opacity(0.2), Color("BrandCream")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            if progress {
                ProgressView().tint(Color("BrandOrange"))
            } else {
                Image(systemName: "fork.knife")
                    .font(.largeTitle)
                    .foregroundStyle(Color("BrandOrange"))
            }
        }
    }
}
