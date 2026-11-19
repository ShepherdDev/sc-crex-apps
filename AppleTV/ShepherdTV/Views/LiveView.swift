import SwiftUI

/// Watch Live: join the stream, or when we're not live, when the next one starts.
struct LiveView: View {
    @ObservedObject var app: AppModel
    @FocusState private var actionFocused: Bool

    var body: some View {
        content
            .onAppear { claimFocus() }
            .onChange(of: app.contentFocusRequest) { claimFocus() }
            .onChange(of: app.home?.generatedAt) { claimFocus() }
    }

    /// After picking Watch Live in the menu, put focus on Join Live / Catch Up.
    private func claimFocus() {
        guard app.focusPending, app.home != nil else { return }
        DispatchQueue.main.async {
            actionFocused = true
            app.focusPending = false
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let home = app.home {
                if let live = home.live {
                    title("We're live")
                    detail("\(live.title)  ·  Started at \(Format.startTimeLabel(live.startTime))")
                    Button("Join Live") { app.playLive() }
                        .buttonStyle(PillButtonStyle())
                        .focused($actionFocused)
                } else {
                    title("We're not live right now")
                    if let next = home.upcoming.first {
                        let label = Format.nextServiceLabel(next.start, now: home.generatedAt)
                        detail("\(label.lead) \(label.emphasis)  ·  \(next.title)")
                    }
                    if let seriesId = home.hero?.seriesId {
                        Button("Catch Up on Our Latest Series") {
                            app.path.append(.series(path: "series?id=\(seriesId)"))
                        }
                        .buttonStyle(PillButtonStyle())
                        .focused($actionFocused)
                    }
                }
            } else if let error = app.homeError {
                ErrorView(message: error) { Task { await app.loadHome() } }
            } else {
                LoadingView()
            }
        }
        .padding(.leading, Config.sideMargin)
        .padding(.top, 300)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func title(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 56, weight: .bold))
            .foregroundStyle(.white)
            .padding(.bottom, 20)
    }

    private func detail(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 30))
            .foregroundStyle(Color.textMuted)
            .frame(maxWidth: 1200, alignment: .leading)
            .padding(.bottom, 56)
    }
}
