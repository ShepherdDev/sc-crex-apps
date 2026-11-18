# TV-Shared

The Shepherd Church TV app's screens, menu, Rock API client and design,
shared by every app that uses React Native:

- `../FireTV-Vega` (Vega OS: Fire TV Stick 4K Select, Fire TV Stick HD 2026)
- `../FireTV-FireOS` (Fire OS / Android TV)

There's no `package.json` here. Each app's Metro config watches this
folder, resolves `@shared/...` to `src/`, and supplies the packages.

Platform differences:

- `src/platform/tv.kepler.ts` / `tv.android.ts`: where TV focus and remote
  APIs come from. Metro picks the file for the platform it's building.
- The video player is supplied by each app (`<App PlayerScreen={...} />`),
  because Vega uses Amazon's Shaka player and Fire OS uses ExoPlayer.
