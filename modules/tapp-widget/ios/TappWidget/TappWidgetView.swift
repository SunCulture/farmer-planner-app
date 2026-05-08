import SwiftUI
import WidgetKit

/// Parses a CSS hex color string (#RRGGBB or #RGB) into a SwiftUI Color.
private func colorFromHex(_ hex: String) -> Color {
    var h = hex.trimmingCharacters(in: .whitespaces)
    if h.hasPrefix("#") { h = String(h.dropFirst()) }
    if h.count == 3 {
        h = h.map { "\($0)\($0)" }.joined()
    }
    guard h.count == 6, let value = UInt64(h, radix: 16) else {
        return Color(red: 0.29, green: 0.56, blue: 0.85)
    }
    let r = Double((value >> 16) & 0xFF) / 255
    let g = Double((value >> 8) & 0xFF) / 255
    let b = Double(value & 0xFF) / 255
    return Color(red: r, green: g, blue: b)
}

struct TappWidgetView: View {
    let entry: TappWidgetEntry

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 6) {
                Circle()
                    .fill(colorFromHex(entry.colorHex))
                    .frame(width: 64, height: 64)
                    .overlay(
                        Image(systemName: "hand.tap.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.white)
                    )

                Text(entry.categoryName)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
            }
            .padding(8)
        }
        .widgetURL(entry.deepLink)
    }
}
