import SwiftUI

// MARK: - Cards

/// What a card shows: a message, a series, or the "See All" card at a row's end.
struct CardModel: Identifiable, Hashable {
    enum Kind: Hashable {
        case message(Message)
        case series(Series)
        case seeAll(path: String, title: String)
    }

    let kind: Kind
    var progress: Double? = nil

    var id: String {
        switch kind {
        case .message(let m): return "m-\(m.id)"
        case .series(let s): return "s-\(s.id)"
        case .seeAll(let path, _): return "all-\(path)"
        }
    }

    static func messages(_ items: [Message]) -> [CardModel] { items.map { CardModel(kind: .message($0)) } }
    static func series(_ items: [Series]) -> [CardModel] { items.map { CardModel(kind: .series($0)) } }
}

/// A 16:9 card. Message cards put the title over a fade at the bottom of the art;
/// series cards are just the art. The .card button style adds the tvOS lift.
struct CardView: View {
    let card: CardModel
    let width: CGFloat
    private var height: CGFloat { (width * 9 / 16).rounded() }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            switch card.kind {
            case .message(let m):
                art(m.image)
                LinearGradient(colors: [.clear, Color.appBackground.opacity(0.95)],
                               startPoint: .center, endPoint: .bottom)
                VStack(alignment: .leading, spacing: 4) {
                    Text(m.title)
                        .font(.system(size: width > 360 ? 24 : 21, weight: .bold))
                        .lineLimit(2)
                    Text(Format.messageMeta(date: m.date, speaker: m.speaker))
                        .font(.system(size: width > 360 ? 18 : 16))
                        .foregroundStyle(Color.textMuted)
                        .lineLimit(1)
                }
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.6), radius: 4)
                .padding(.horizontal, 18)
                .padding(.bottom, card.progress == nil ? 16 : 22)
            case .series(let s):
                art(s.image)
            case .seeAll:
                Color.surface
                Text("See All")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            if let progress = card.progress {
                ZStack(alignment: .leading) {
                    Rectangle().fill(Color.white.opacity(0.25))
                    Rectangle().fill(Color.shepherdBlue).frame(width: width * progress)
                }
                .frame(height: 6)
            }
        }
        .frame(width: width, height: height)
        .clipped()
    }

    private func art(_ path: String?) -> some View {
        AsyncImage(url: Config.imageURL(path, width: Int(width * 2))) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
            } else {
                Color.surface
            }
        }
        .frame(width: width, height: height)
        .clipped()
    }
}

/// A titled row of cards that scrolls sideways.
struct CardRow: View {
    let title: String
    let cards: [CardModel]
    let onSelect: (CardModel) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 30, weight: .bold))
                .foregroundStyle(.white)
                .padding(.leading, Config.sideMargin)
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 32) {
                    ForEach(cards) { card in
                        Button { onSelect(card) } label: { CardView(card: card, width: 400) }
                            .buttonStyle(.card)
                    }
                }
                .padding(.horizontal, Config.sideMargin)
                .padding(.vertical, 24)
            }
            .scrollClipDisabled()
        }
    }
}

/// Grid used by series lists and series pages. 4 across, filling the content area.
struct CardGrid: View {
    let cards: [CardModel]
    let onSelect: (CardModel) -> Void
    static let cardWidth: CGFloat = 320

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.fixed(Self.cardWidth), spacing: 32, alignment: .top), count: 4),
                  alignment: .leading, spacing: 48) {
            ForEach(cards) { card in
                Button { onSelect(card) } label: { CardView(card: card, width: Self.cardWidth) }
                    .buttonStyle(.card)
            }
        }
    }
}

// MARK: - Buttons

/// Rounded pill button: blue (or translucent), white when focused.
struct PillButtonStyle: ButtonStyle {
    var primary = true
    func makeBody(configuration: Configuration) -> some View {
        PillLabel(label: configuration.label, primary: primary, pressed: configuration.isPressed)
    }
}

private struct PillLabel<Label: View>: View {
    let label: Label
    let primary: Bool
    let pressed: Bool
    @Environment(\.isFocused) private var isFocused

    var body: some View {
        label
            .font(.system(size: 28, weight: .bold))
            .foregroundStyle(isFocused || primary ? Color.appBackground : .white)
            .padding(.horizontal, 48)
            .frame(minWidth: 240, minHeight: 72)
            .background(
                Capsule().fill(isFocused ? Color.white : (primary ? Color.shepherdBlue : Color.white.opacity(0.15)))
            )
            .scaleEffect(pressed ? 0.97 : (isFocused ? 1.05 : 1))
            .animation(.easeOut(duration: 0.15), value: isFocused)
    }
}

// MARK: - Small pieces

/// "Next service in 3 hours".
struct NextServicePill: View {
    let lead: String
    let emphasis: String

    var body: some View {
        HStack(spacing: 10) {
            Text(lead).foregroundStyle(Color.textMuted)
            Text(emphasis).fontWeight(.bold).foregroundStyle(.white)
        }
        .font(.system(size: 24))
        .padding(.horizontal, 28)
        .frame(height: 56)
        .background(Capsule().fill(Color.surface.opacity(0.9)))
    }
}

struct ErrorView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 40) {
            Text(message)
                .font(.system(size: 32))
                .foregroundStyle(Color.textMuted)
                .frame(maxWidth: 1100, alignment: .leading)
            Button("Try Again", action: retry)
                .buttonStyle(PillButtonStyle())
        }
        .padding(.leading, Config.sideMargin)
        .padding(.top, 360)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct LoadingView: View {
    var body: some View {
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
