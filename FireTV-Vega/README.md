# Shepherd Church: Fire TV app (Vega OS)

For the Fire TV Sticks that run **Vega OS** (Fire TV Stick 4K Select 2025,
Fire TV Stick HD 2026, and every new stick from here on). These can't run the
old Android app in `../FireTV`.

Content comes from the **Shepherd Church TV** Lava Application in Rock
(`https://rock.shepherdchurch.net/api/v2/lava-app/1/tv`, source in
`../Rock/helix`). Nothing in this app needs changing to publish a new sermon.

## Screens
- **Home:** banner (latest message, or LIVE NOW during a scheduled stream),
  "Next live" time, Continue Watching, Latest Messages, the current series,
  All Series, Life Groups.
- **Series:** series art, description, and its messages.
- **See all:** every series as a grid.
- **Player:** Amazon's built-in controls. Live joins at the live point;
  recorded messages resume where this TV left off.

## Requirements
- A Mac (Apple Silicon recommended) or Ubuntu. Windows is not supported.
- Vega SDK: `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env`
- Node 22.14 or newer.
- A Vega Fire TV Stick in developer mode for testing (older Fire TVs can't run this app).

## One-time setup: Shaka Player (HLS playback)
Vega plays HLS through Amazon's patched Shaka Player, which is not in git.
1. Download **Shaka Player for Vega** (the newest 4.16.x) from Amazon's
   developer resources. It's linked from the Vega docs page
   "Play adaptive content (HLS/DASH) with Shaka Player".
2. `tar -xzf shaka-rel-*.tar.gz`, then `cd shaka-rel/scripts && ./setup.sh`
3. Copy `shaka-rel/src/*` into this folder's `src/`, and the generated
   `shaka-player/dist` folder into `src/shakaplayer/`.
4. Add any extra npm packages its README lists to `package.json`.

`src/player/shaka.ts` is the only file that talks to Shaka.

## Build and run
```
npm install
npm run build:debug                  # or build:release
vega device list                     # find the Fire TV Stick
vega run-app build/*/*.vpkg          # path printed by the build
```

## Checks
```
npx tsc --noEmit                     # types
npm run lint
npm test                             # date-label unit tests
```

## Code map
- `src/config.ts`: Rock URL, colors, margins
- `src/api/`: API client, response types, date labels
- `src/storage/progress.ts`: Continue Watching (saved on the TV only)
- `src/App.tsx`: screen stack and the remote's Back button
- `src/screens/`: Home, Series, See all, Player
- `src/components/`: buttons, cards, scrolling rows
