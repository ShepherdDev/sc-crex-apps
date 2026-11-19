import SwiftUI

enum AppSection: String, CaseIterable, Identifiable {
    case home, live, series, groups

    var id: String { rawValue }

    var label: String {
        switch self {
        case .home: return "Home"
        case .live: return "Watch Live"
        case .series: return "Series"
        case .groups: return "Life Groups"
        }
    }

    var symbol: String {
        switch self {
        case .home: return "house.fill"
        case .live: return "dot.radiowaves.left.and.right"
        case .series: return "square.stack.fill"
        case .groups: return "person.2.fill"
        }
    }
}

/// Screens pushed on top of a section.
enum Route: Hashable {
    case series(path: String)
    case seriesList(path: String, title: String)
}

/// What the full-screen player is playing.
enum PlayRequest: Identifiable, Hashable {
    case message(Message)
    case live(LiveStream)

    var id: String {
        switch self {
        case .message(let m): return "message-\(m.id)"
        case .live: return "live"
        }
    }
}

/// App-wide state: the home data (refreshed every minute while nothing is
/// playing), the section in the menu, the screen stack, and what's playing.
@MainActor
final class AppModel: ObservableObject {
    @Published var home: HomeResponse?
    @Published var homeError: String?
    @Published var section: AppSection = .home
    @Published var path: [Route] = []
    @Published var playing: PlayRequest?

    /// Picking a section in the menu moves focus to that section's main control.
    /// Screens watch `contentFocusRequest` and claim focus while `focusPending` is set.
    @Published var contentFocusRequest = 0
    var focusPending = false

    var isLive: Bool { home?.live != nil }

    func select(_ section: AppSection, focusContent: Bool = false) {
        self.section = section
        path = []
        if focusContent {
            focusPending = true
            contentFocusRequest += 1
        }
    }

    func loadHome() async {
        do {
            home = try await API.home()
            homeError = nil
        } catch {
            print("[home] \(error)")
            // Keep showing what we had if a background refresh fails.
            if home == nil { homeError = API.describe(error) }
        }
    }

    /// Refresh every 60 seconds so LIVE and the countdown stay current.
    /// Paused while something plays.
    func refreshLoop() async {
        while !Task.isCancelled {
            if playing == nil { await loadHome() }
            try? await Task.sleep(nanoseconds: 60 * 1_000_000_000)
        }
    }

    func play(_ message: Message) { playing = .message(message) }

    func playLive() {
        if let live = home?.live { playing = .live(live) }
    }

    /// Deep links: shepherdtv://message/<id>, shepherdtv://series/<id>, shepherdtv://live
    func handle(_ url: URL) {
        guard url.scheme == "shepherdtv" else { return }
        let id = url.pathComponents.dropFirst().first
        print("[deeplink] \(url)")
        switch url.host {
        case "live":
            select(.live)
            playLive()
        case "series":
            if let id {
                select(.home)
                path = [.series(path: "series?id=\(id)")]
            }
        case "message":
            if let id {
                select(.home)
                Task {
                    if let message = try? await API.message(id: id) { playing = .message(message) }
                }
            }
        default:
            break
        }
    }
}
