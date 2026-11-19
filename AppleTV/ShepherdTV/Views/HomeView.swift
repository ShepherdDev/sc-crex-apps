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
                    LinearGradient(colors: [.appBackground, .appBackground.opacity(0)], startPoint: .leading, endPoint: .trailing)
                        .frame(width: 480)
                }
                .overlay(alignment: .bottom) {
                    LinearGradient(colors: [.appBackground.opacity(0), .appBackground], startPoint: .top, endPoint: .bottom)
                        .frame(height: 300)
                }
            }

            VStack(alignment: .leading, spacing: 0) {
                if let hero = home.hero {
                    Text((hero.seriesTitle ?? "").uppercased())
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Color.shepherdBlue)
                        .padding(.bottom, 14)
                    Text(hero.title)
                        .font(.system(size: 56, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .frame(maxWidth: 900, alignment: .leading)
                        .padding(.bottom, 18)
                    Text(Format.messageMeta(date: hero.date, speaker: hero.speaker))
                        .font(.system(size: 24))
                        .foregroundStyle(Color.textMuted)
                        .padding(.bottom, 22)
                    Text(hero.description ?? "")
                        .font(.system(size: 24))
                        .foregroundStyle(Color.textDim)
                        .lineLimit(3)
                        .frame(maxWidth: 760, alignment: .leading)
                        .padding(.bottom, 40)
                } else {
                    Text("Shepherd Church")
                        .font(.system(size: 56, weight: .bold))
                        .padding(.bottom, 40)
                }

                HStack(spacing: 24) {
                    if home.live != nil {
                        Button("Watch Live") { app.playLive() }
                            .buttonStyle(PillButtonStyle(primary: true))
                            .prefersDefaultFocus(true, in: focusScope)
                    }
                    if let hero = home.hero {
                        Button("Watch Now") { app.play(hero) }
                            .buttonStyle(PillButtonStyle(primary: home.live == nil))
                            .prefersDefaultFocus(home.live == nil, in: focusScope)
                    }
                }
            }
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
