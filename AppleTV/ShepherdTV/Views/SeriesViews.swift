import SwiftUI

/// Loading state for screens that fetch their own data.
enum Load<T> {
    case loading
    case loaded(T)
    case failed(String)
}

/// A channel's series (Series, Life Groups, See All), 4 across.
struct SeriesListView: View {
    @ObservedObject var app: AppModel
    let path: String
    let title: String
    @State private var state: Load<SeriesListResponse> = .loading
    @FocusState private var gridFocus: String?

    var body: some View {
        Group {
            switch state {
            case .loading:
                LoadingView()
            case .failed(let error):
                ErrorView(message: error) { Task { await load() } }
            case .loaded(let data):
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 40) {
                        Text(data.title?.isEmpty == false ? data.title! : title)
                            .font(.system(size: 48, weight: .bold))
                            .foregroundStyle(.white)
                        CardGrid(cards: CardModel.series(data.series), focus: $gridFocus) { card in
                            if case .series(let s) = card.kind { app.path.append(.series(path: s.url)) }
                        }
                    }
                    .padding(.horizontal, Config.sideMargin)
                    .padding(.top, 88)
                    .padding(.bottom, 80)
                }
                .scrollClipDisabled()
            }
        }
        .task(id: path) { await load() }
        .onChange(of: app.contentFocusRequest) { claimFocus() }
    }

    private func load() async {
        state = .loading
        do { state = .loaded(try await API.seriesList(path)) } catch { state = .failed(API.describe(error)) }
        claimFocus()
    }

    /// After picking Series / Life Groups in the menu, put focus on the first card.
    private func claimFocus() {
        guard app.focusPending, case .loaded(let data) = state, let first = data.series.first else { return }
        DispatchQueue.main.async {
            gridFocus = CardModel(kind: .series(first)).id
            app.focusPending = false
        }
    }
}

/// One series: its title and description, then its messages.
struct SeriesView: View {
    @ObservedObject var app: AppModel
    let path: String
    @State private var state: Load<SeriesResponse> = .loading
    @ObservedObject private var progress = ProgressStore.shared

    var body: some View {
        Group {
            switch state {
            case .loading:
                LoadingView()
            case .failed(let error):
                ErrorView(message: error) { Task { await load() } }
            case .loaded(let data):
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {
                        Text(data.series.title)
                            .font(.system(size: 48, weight: .bold))
                            .foregroundStyle(.white)
                        if let description = data.series.description, !description.isEmpty {
                            Text(description)
                                .font(.system(size: 24))
                                .foregroundStyle(Color.textDim)
                                .lineLimit(2)
                                .frame(maxWidth: 1300, alignment: .leading)
                        }
                        CardGrid(cards: data.messages.map { m in
                            let p = progress.items.first { $0.message.id == m.id }?.fraction
                            return CardModel(kind: .message(m), progress: p)
                        }) { card in
                            if case .message(let m) = card.kind { app.play(m) }
                        }
                        .padding(.top, 20)
                    }
                    .padding(.horizontal, Config.sideMargin)
                    .padding(.top, 88)
                    .padding(.bottom, 80)
                }
                .scrollClipDisabled()
            }
        }
        .task(id: path) { await load() }
    }

    private func load() async {
        state = .loading
        do { state = .loaded(try await API.series(path)) } catch { state = .failed(API.describe(error)) }
    }
}
