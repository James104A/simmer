import SwiftUI

struct TagChip: View {
    let text: String
    var systemImage: String?
    var style: Style = .neutral

    enum Style {
        case neutral
        case accent
        case outline
    }

    var body: some View {
        HStack(spacing: 4) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.caption2)
            }
            Text(text)
                .font(.caption)
                .lineLimit(1)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(background)
        .foregroundStyle(foreground)
        .clipShape(Capsule())
        .overlay {
            if style == .outline {
                Capsule().stroke(Color.secondary.opacity(0.3), lineWidth: 1)
            }
        }
    }

    private var background: Color {
        switch style {
        case .neutral: return Color.secondary.opacity(0.15)
        case .accent: return Color("BrandOrange").opacity(0.15)
        case .outline: return .clear
        }
    }

    private var foreground: Color {
        switch style {
        case .neutral: return .primary
        case .accent: return Color("BrandOrange")
        case .outline: return .primary
        }
    }
}
