import SwiftUI

/// The always-visible menu on the left. Icons and words are always shown so
/// nobody has to guess what an icon means. Contents start inside the
/// title-safe area because many TVs crop the picture's edges.
struct SideMenu: View {
    @ObservedObject var app: AppModel
    var focus: FocusState<AppSection?>.Binding

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image("Logo")
                .resizable()
                .scaledToFit()
                .frame(width: 256, height: 43)
                .padding(.leading, 12)
                .padding(.bottom, 64)
                .accessibilityLabel("Shepherd Church")

            ForEach(AppSection.allCases) { section in
                Button {
                    app.select(section, focusContent: true)
                } label: {
                    MenuRow(
                        section: section,
                        isCurrent: app.section == section,
                        showLive: section == .live && app.isLive
                    )
                }
                .buttonStyle(MenuButtonStyle())
                .focused(focus, equals: section)
                .accessibilityLabel(section == .live && app.isLive ? "Watch Live, live now" : section.label)
            }
            Spacer(minLength: 0)
        }
        .padding(.top, 64)
        .padding(.leading, 84)
        .padding(.trailing, 16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(
            Color.rail.overlay(alignment: .trailing) {
                Rectangle().fill(Color.white.opacity(0.08)).frame(width: 1)
            }
        )
        .focusSection()
        // Coming into the menu lands on the section that's on screen.
        .defaultFocus(focus, app.section, priority: .userInitiated)
        // Back in the menu: go Home first; on Home, let tvOS leave the app.
        .onExitCommand(perform: exitAction)
    }

    /// nil hands the Menu button back to tvOS, which leaves the app.
    private var exitAction: (() -> Void)? {
        if app.section == .home { return nil }
        return { app.select(.home) }
    }
}

private struct MenuButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
    }
}

private struct MenuRow: View {
    let section: AppSection
    let isCurrent: Bool
    let showLive: Bool
    @Environment(\.isFocused) private var isFocused

    private var color: Color {
        if isFocused { return .appBackground }
        return isCurrent ? .shepherdBlue : .textMuted
    }

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: section.symbol)
                .font(.system(size: 26, weight: .semibold))
                .frame(width: 34)
            Text(section.label)
                .font(.system(size: 26, weight: isFocused || isCurrent ? .bold : .medium))
                .lineLimit(1)
            Spacer(minLength: 0)
            if showLive {
                Text("LIVE")
                    .font(.system(size: 16, weight: .bold))
                    .tracking(1)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(RoundedRectangle(cornerRadius: 6).fill(Color.shepherdRed))
            }
        }
        .foregroundStyle(color)
        .padding(.horizontal, 16)
        .frame(height: 72)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(isFocused ? Color.white : (isCurrent ? Color.shepherdBlue.opacity(0.14) : Color.clear))
        )
        .scaleEffect(isFocused ? 1.04 : 1)
        .animation(.easeOut(duration: 0.15), value: isFocused)
    }
}
