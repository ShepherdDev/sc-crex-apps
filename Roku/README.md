# Shepherd Church Roku channel (2.0)

Plain SceneGraph/BrightScript on the Helix TV API
(`https://rock.shepherdchurch.net/api/v2/lava-app/1/tv`). No Crex.
Plan and status: `claude/roku-2.0-plan.md` in the IT Projects Claude project.

## Layout

- `source/main.brs` opens the screen. `source/lib/` holds shared helpers
  (`config.brs` settings and API helper, `format.brs` date labels ported from
  `TV-Shared/src/api/format.ts`, `content.brs` card data).
- `components/MainScene` owns the side menu, the screen stack, home refresh
  (every 60 s, paused while playing), the player and the Back rules.
- `components/screens/` Home, Live, and GridScreen (series lists and one series).
- `components/controls/` Card and PillButton. `components/menu/` the side menu.

Everything is laid out for 1920x1080 (`ui_resolutions=fhd`), the same design
size as the Fire TV app.

## Build and sideload

```
npm i -g brighterscript      # once
bsc --project bsconfig.json  # syntax/type check
zip -r ../ShepherdChurch-Roku.zip manifest source components images
```

Upload the zip on the Roku's dev installer page (its IP in a browser, user
`rokudev`). Debug output: `telnet <roku-ip> 8085`.

Publishing needs a Roku rekeyed with the channel's original signing key
(old `.pkg` plus its password, kept in the church password manager).
