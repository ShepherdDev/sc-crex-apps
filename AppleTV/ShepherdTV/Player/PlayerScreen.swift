import AVKit
import SwiftUI

/// Full-screen playback with Apple's own player, which handles the Siri Remote,
/// skipping, subtitles (swipe down for the info panel) and live streams.
/// The Menu button closes it.
struct PlayerScreen: View {
    let request: PlayRequest
    @StateObject private var controller: PlayerController
    @Environment(\.dismiss) private var dismiss

    init(request: PlayRequest) {
        self.request = request
        _controller = StateObject(wrappedValue: PlayerController(request: request))
    }

    var body: some View {
        AVPlayerView(player: controller.player)
            .ignoresSafeArea()
            .onAppear { controller.start() }
            .onDisappear { controller.stop() }
            .onReceive(controller.$finished) { finished in
                if finished { dismiss() }
            }
    }
}

private struct AVPlayerView: UIViewControllerRepresentable {
    let player: AVPlayer

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let vc = AVPlayerViewController()
        vc.player = player
        return vc
    }

    func updateUIViewController(_ vc: AVPlayerViewController, context: Context) {}
}

@MainActor
final class PlayerController: ObservableObject {
    let player: AVPlayer
    @Published var finished = false

    private let request: PlayRequest
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var started = false

    init(request: PlayRequest) {
        self.request = request
        let urlString: String
        let title: String
        switch request {
        case .message(let m):
            urlString = m.videoUrl
            title = m.title
        case .live(let live):
            urlString = live.videoUrl
            title = live.title
        }
        let item = AVPlayerItem(url: URL(string: urlString) ?? URL(string: "about:blank")!)
        // Title for the info panel.
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle
        titleItem.value = title as NSString
        titleItem.extendedLanguageTag = "und"
        item.externalMetadata = [titleItem]
        player = AVPlayer(playerItem: item)
        print("[player] \(urlString)")
    }

    func start() {
        guard !started else { return }
        started = true

        if case .message(let m) = request {
            // Pick up where they left off. (Live never seeks: it starts at the live point.)
            let resumeAt = ProgressStore.shared.resumePosition(for: m.id)
            if resumeAt > 0 {
                player.seek(to: CMTime(seconds: resumeAt, preferredTimescale: 600))
            }
            timeObserver = player.addPeriodicTimeObserver(
                forInterval: CMTime(seconds: 15, preferredTimescale: 1), queue: .main
            ) { [weak self] _ in
                Task { @MainActor in self?.saveProgress() }
            }
        }

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime, object: player.currentItem, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.didFinish() }
        }

        player.play()
    }

    func stop() {
        if !finished { saveProgress() }
        player.pause()
        if let timeObserver { player.removeTimeObserver(timeObserver) }
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        timeObserver = nil
        endObserver = nil
    }

    private func saveProgress() {
        guard case .message(let m) = request, let item = player.currentItem else { return }
        let position = player.currentTime().seconds
        let duration = item.duration.seconds
        guard position.isFinite, duration.isFinite, duration > 0 else { return }
        ProgressStore.shared.save(m, position: position, duration: duration)
    }

    /// Watched to the end: drop it from Continue Watching and close the player.
    private func didFinish() {
        if case .message(let m) = request { ProgressStore.shared.remove(m.id) }
        finished = true
    }
}
