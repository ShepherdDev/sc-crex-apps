import Foundation

/// A partly watched message, saved on this Apple TV only.
struct ProgressItem: Codable, Hashable, Identifiable {
    let message: Message
    let position: Double   // seconds
    let duration: Double   // seconds
    let updatedAt: Date

    var id: String { message.id }
    var fraction: Double { duration > 0 ? min(1, position / duration) : 0 }
}

/// Resume points and the Continue Watching row. Same rules as the Fire TV and
/// Roku apps: ignore the first minute and the last five, keep up to 20.
@MainActor
final class ProgressStore: ObservableObject {
    static let shared = ProgressStore()

    @Published private(set) var items: [ProgressItem] = []

    private let key = "shepherd.progress.v1"
    private let maxItems = 20
    private let minPosition: Double = 60
    private let endMargin: Double = 300

    private init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let saved = try? JSONDecoder().decode([ProgressItem].self, from: data) {
            items = saved
        }
    }

    func resumePosition(for id: String) -> Double {
        items.first { $0.message.id == id }?.position ?? 0
    }

    func save(_ message: Message, position: Double, duration: Double) {
        var next = items.filter { $0.message.id != message.id }
        if position >= minPosition, duration > 0, position < duration - endMargin {
            next.insert(ProgressItem(message: message, position: position, duration: duration, updatedAt: Date()), at: 0)
        }
        items = Array(next.prefix(maxItems))
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    func remove(_ id: String) {
        guard let message = items.first(where: { $0.message.id == id })?.message else { return }
        save(message, position: 0, duration: 0)
    }
}
