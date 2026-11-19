import SwiftUI

/// Home: the latest message up top, then Continue Watching and the rows.
struct HomeView: View {
    @ObservedObject var app: AppModel
    let focusScope: Namespace.ID
    @ObservedObject private var progress = ProgressStore.shared

    var body: some View {
        if let home = app.home {
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 40) {
                    HeroView(app: app, home: home, focusScope: focusScope)

                    if !progress.items.isEmpty {
                        CardRow(title: "Continue Watching",
                                cards: progress.items.map { CardModel(kind: .message($0.message), progress: $0.fraction) },
                                onSelect: openCard)
                    }

                    ForEach(home.rows) { row in
                        CardRow(title: row.title, cards: cards(for: row), onSelect: openCard)
                    }
                }
                .padding(.bottom, 80)
            }
            .scrollClipDisabled()
        } else if let error = app.homeError {
            ErrorView(message: error) { Task { await app.loadHome() } }
        } else {
            LoadingView()
        }
    }

    private func cards(for row: HomeRow) -> [CardModel] {
        guard row.type == "series" else { return CardModel.messages(row.messages) }
        var cards = CardModel.series(row.series)
        if let all = row.seeAllUrl, !all.isEmpty {
            cards.append(CardModel(kind: .seeAll(path: all, title: row.title)))
        }
        return cards
    }

    private func openCard(_ card: CardModel) {
        switch card.kind {
        case .message(let m): app.play(m)
        case .series(let s): app.path.append(.series(path: s.url))
        case .seeAll(let path, let title): app.path.append(.seriesList(path: path, title: title))
        }
    }
}

/// The banner: art on the right fading into the background, the latest
/// message's title and description, and Watch Live / Watch Now.
private struct HeroView: View {
    @ObservedObject var app: AppModel
    let home: HomeResponse
    let focusScope: Namespace.ID

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Art on the right, fading left and down into the background.
            HStack {
                Spacer(minLength: 0)
                AsyncImage(url: Config.imageURL(home.hero?.image, width: 1920)) { phase in
                    if let image = phase.image { image.resizable().scaledToFill() } else { Color.clear }
                }
                .frame(width: 1160, height: 652)
                .clipped()
                .overlay(alignment: .leading) {
                    // Wide, gradual fade so the title and description stay readable over the art.
                    LinearGradient(
                        stops: [
                            .init(color: .appBackground, location: 0),
                            .init(color: .appBackground.opacity(0.85), location: 0.4),
                            .init(color: .appBackground.opacity(0), location: 1),
                        ],
                        startPoint: .leading, endPoint: .trailing
                    )
                    .frame(width: 760)
                }
                .overlay(alignment: .bottom) {
                    LinearGradient(colors: [.appBackground.opacity(0), .appBackground], startPoint: .top, endPoint: .bottom)
                        .frame(height: 300)
                }
            }

            // Same banner as the Fire TV app: while live, the live stream is front and
            // center with a single Join Live button; otherwise the latest message.
            VStack(alignment: .leading, spacing: 0) {
                if let live = home.live {
                    HStack(spacing: 16) {
                        LiveBadge()
                        Text("Started at \(Format.startTimeLabel(live.startTime))")
                            .font(.system(size: 28))
                            .foregroundStyle(Color.textMuted)
                    }
                    .padding(.bottom, 18)
                    Text(live.title)
                        .font(.system(size: 84, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .padding(.bottom, 18)
                    Text("Streaming live from Shepherd Church")
                        .font(.system(size: 28))
                        .foregroundStyle(Color.textMuted)
                    HStack(spacing: 20) {
                        Button { app.playLive() } label: { Label("Join Live", systemImage: "play.fill") }
                            .buttonStyle(PillButtonStyle(primary: true))
                            .prefersDefaultFocus(true, in: focusScope)
                    }
                    .padding(.top, 36)
                } else if let hero = home.hero {
                    Text("LATEST MESSAGE")
                        .font(.system(size: 24, weight: .bold))
                        .tracking(3)
                        .foregroundStyle(Color.shepherdBlue)
                        .padding(.bottom, 18)
                    Text(hero.title)
                        .font(.system(size: 84, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .minimumScaleFactor(0.7)
                        .padding(.bottom, 18)
                    Text([hero.seriesTitle, hero.speaker].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                        .font(.system(size: 28))
                        .foregroundStyle(Color.textMuted)
                        .lineLimit(1)
                    if let description = hero.description, !description.isEmpty {
                        Text(description)
                            .font(.system(size: 26))
                            .foregroundStyle(Color(hex: 0xE3E6EA))
                            .lineSpacing(6)
                            .lineLimit(3)
                            .padding(.top, 18)
                    }
                    HStack(spacing: 20) {
                        Button { app.play(hero) } label: { Label("Watch Now", systemImage: "play.fill") }
                            .buttonStyle(PillButtonStyle(primary: true))
                            .prefersDefaultFocus(true, in: focusScope)
                        if let seriesId = hero.seriesId {
                            Button("View Series") { app.path.append(.series(path: "series?id=\(seriesId)")) }
                                .buttonStyle(PillButtonStyle(primary: false))
                        }
                    }
                    .padding(.top, 36)
                }
            }
            .frame(width: 640, alignment: .leading)
            .padding(.leading, Config.sideMargin)
            .padding(.top, 140)

            if home.live == nil, let next = home.upcoming.first {
                let label = Format.nextServiceLabel(next.start, now: home.generatedAt)
                HStack {
                    Spacer()
                    NextServicePill(lead: label.lead, emphasis: label.emphasis)
                }
                .padding(.top, 64)
                .padding(.trailing, 96)
            }
        }
        .frame(height: 652)
        .focusSection()
    }
}

/// Red "● LIVE NOW" badge.
private struct LiveBadge: View {
    var body: some View {
        HStack(spacing: 10) {
            Circle().fill(Color.white).frame(width: 14, height: 14)
            Text("LIVE NOW")
                .font(.system(size: 24, weight: .bold))
                .tracking(3)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 8).fill(Color.shepherdRed))
    }
}
