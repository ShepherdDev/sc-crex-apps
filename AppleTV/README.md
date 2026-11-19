# Shepherd Church Apple TV app (2.0)

SwiftUI, tvOS 17+, on the Helix TV API
(`https://rock.shepherdchurch.net/api/v2/lava-app/1/tv`). Replaces the 2019
Xamarin/Crex app (tag `release-appletv-1.1`). Same bundle ID,
`com.shepherdchurch.ATVApp`, so it ships as an update to the existing App Store app.

## First build on the Mac

1. Install Xcode from the App Store (once).
2. Install XcodeGen (once): `brew install xcodegen`
3. In Terminal, from the repo: `cd AppleTV && xcodegen`
   This creates `ShepherdTV.xcodeproj` from `project.yml`. Run it again
   whenever files are added or removed. The project file isn't committed.
4. `open ShepherdTV.xcodeproj`
5. Target ShepherdTV → Signing & Capabilities → Team: the church's Apple
   Developer team. (To keep it, put the Team ID in `DEVELOPMENT_TEAM` in `project.yml`.)
6. Pick an Apple TV simulator (or a real Apple TV) at the top and press Run.

## Layout

- `App/` app entry, `AppModel` (home refresh every 60 s, paused while playing;
  section, screen stack, player, deep links), `Config` (API, colors, sizes).
- `API/` `APIClient`. `Models/` response types and `Format` (date labels,
  ported from `TV-Shared/src/api/format.ts`).
- `Views/` `RootView` (menu + content + Back rules), `SideMenu`, `HomeView`,
  `LiveView`, `SeriesViews`, `Components` (cards, rows, grid, buttons).
- `Player/` Apple's AVPlayerViewController: Siri Remote, skipping, subtitles
  (swipe down), live. Resume and Continue Watching via `Storage/ProgressStore`.
- `Resources/Assets.xcassets` layered app icon (bands + logo, so tvOS gives it
  the parallax shine), top shelf, logo, launch screen.

## Deep links

`shepherdtv://message/<id>`, `shepherdtv://series/<id>`, `shepherdtv://live`.
Test in the simulator: `xcrun simctl openurl booted shepherdtv://live`

## Releasing

Bump `CURRENT_PROJECT_VERSION` in `project.yml` for every upload (1.1 was build 5).
Product → Archive → Distribute App → App Store Connect.
