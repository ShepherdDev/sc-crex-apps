import SwiftUI

/// Where the app gets its content (the "Shepherd Church TV" Lava Application in Rock)
/// and the shared look. Sizes are in points; tvOS lays out at 1920x1080, the same
/// design size as the Fire TV and Roku apps, so the numbers match theirs.
enum Config {
    static let rockHost = "https://rock.shepherdchurch.net"
    static let apiBase = "\(rockHost)/api/v2/lava-app/1/tv"

    static let menuWidth: CGFloat = 400
    static let sideMargin: CGFloat = 72

    /// Full URL for a Rock image path, asking Rock for a copy sized for where it's
    /// shown. The originals are 7680x4320, far too big to load as-is.
    static func imageURL(_ path: String?, width: Int) -> URL? {
        guard let path, !path.isEmpty else { return nil }
        var url = path.hasPrefix("http") ? path : rockHost + path
        if url.contains("GetImage.ashx") {
            url += (url.contains("?") ? "&" : "?") + "width=\(width)"
        }
        return URL(string: url)
    }
}

/// Shepherd screen colors on the dark TV theme.
extension Color {
    static let appBackground = Color(hex: 0x0B0C0E)
    static let surface = Color(hex: 0x1A1D21)
    static let rail = Color(hex: 0x060708)
    static let textMuted = Color(hex: 0xC9CDD2)
    static let textDim = Color(hex: 0xA9AEB5)
    static let shepherdBlue = Color(hex: 0x43B2E5)
    static let shepherdRed = Color(hex: 0x9F1C20)

    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}
