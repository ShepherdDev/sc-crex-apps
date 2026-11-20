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
Vega plays HLS through Amazon's patched Shaka Player. Amazon's files are
licensed ("AMAZON PROPRIETARY/CONFIDENTIAL") and this repo is public, so they
are **gitignored and must never be committed**.

1. Download **Shaka Player for Vega 4.16.13** (`shaka-rel-v4.16.13-r1.2-devices_scope.tar.gz`)
   from the link on Amazon's Vega docs page "Play adaptive content (HLS/DASH)
   with Shaka Player". Put it in this folder and extract it:
   `tar -xzf shaka-rel-*.tar.gz`
2. Copy Amazon's wrapper files into `src/`:
   `cp -R shaka-rel/src/shakaplayer shaka-rel/src/polyfills shaka-rel/src/PlayerInterface.ts src/`
   (Leave out its `App*.tsx` sample apps.)
3. Build Shaka. Amazon's `shaka-rel/scripts/setup.sh` clones Shaka 4.16.13,
   applies Amazon's patches and compiles. Two things trip it up:
   - It needs Java 21+ (`brew install openjdk@21`).
   - Shaka's dev dependencies include a GitHub package fetched over SSH. If you
     have no GitHub SSH key, first run:
     `git config --global url."https://github.com/".insteadOf ssh://git@github.com/`
   The app only needs the core player, so after the patches apply you can build just that:
   `cd shaka-rel/scripts/shaka-player && python3 build/build.py --name compiled +@complete -@ui -@polyfillForUI --mode debug`
4. Copy `shaka-player.compiled.debug.js` (and its `.d.ts`, `.externs.js`, `.map`)
   from `shaka-rel/scripts/shaka-player/dist/` into `src/shakaplayer/dist/`.

Amazon's wrapper imports a `PlayerBase.ts` that its package doesn't include;
`src/PlayerBase.ts` is ours. `src/player/shaka.ts` is the only file of ours that
talks to Shaka.

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
