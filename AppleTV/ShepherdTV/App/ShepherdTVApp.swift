import SwiftUI

@main
struct ShepherdTVApp: App {
    init() {
        // Cache Rock images on disk so rows don't re-download art when scrolling back.
        URLCache.shared = URLCache(memoryCapacity: 64 * 1024 * 1024, diskCapacity: 256 * 1024 * 1024)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}
