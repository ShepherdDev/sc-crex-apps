import SwiftUI

/// The whole app: the side menu on the left, the current section to its right,
/// and the player over everything when something is playing.
///
/// Menu button (Back) rules, same as the other apps: close the player, pop the
/// screen, then move to the menu, then go Home, then leave the app.
struct RootView: View {
    @StateObject private var app = AppModel()
    @FocusState private var menuFocus: AppSection?
    @Namespace private var focusScope

    var body: some View {
        HStack(spacing: 0) {
            SideMenu(app: app, focus: $menuFocus)
                .frame(width: Config.menuWidth)

            NavigationStack(path: $app.path) {
                sectionView
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    // Back from a section's first screen: go to the menu.
                    .onExitCommand { menuFocus = app.section }
                    .navigationDestination(for: Route.self) { route in
                        switch route {
                        case .series(let path):
                            SeriesView(app: app, path: path)
                        case .seriesList(let path, let title):
                            SeriesListView(app: app, path: path, title: title)
                        }
                    }
            }
            .focusSection()
        }
        .focusScope(focusScope)
        .background(Color.appBackground)
        .ignoresSafeArea()
        .preferredColorScheme(.dark)
        .task { await app.refreshLoop() }
        .fullScreenCover(item: $app.playing) { request in
            PlayerScreen(request: request)
        }
        .onChange(of: app.playing?.id) { _, now in
            // Back from the player: refresh right away (Continue Watching, LIVE).
            if now == nil { Task { await app.loadHome() } }
        }
        .onOpenURL { app.handle($0) }
    }

    @ViewBuilder
    private var sectionView: some View {
        switch app.section {
        case .home:
            HomeView(app: app, focusScope: focusScope)
        case .live:
            LiveView(app: app)
        case .series:
            SeriesListView(app: app, path: "series-list?channel=sermons", title: "Series")
        case .groups:
            SeriesListView(app: app, path: "series-list?channel=lifegroups", title: "Life Groups")
        }
    }
}
