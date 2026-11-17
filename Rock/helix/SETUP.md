# Shepherd Church TV API (Helix Lava Application)

Replaces the Blue Box Moon **Crex** plugin pages (`/api/crex/page/...`) with a
core-Rock Lava Application. Responses use the same JSON shape Crex used, so the
existing Roku app works by changing only its `ApplicationRootUrl`.

Base URL: `https://rock.shepherdchurch.net/api/v2/lava-app/1/tv`

| Endpoint | Method | Lava Commands | Cache (seconds) | Returns |
|---|---|---|---|---|
| `home` | GET | RockEntity | 60 | Menu (Watch Live / Service Times, Current Series, Archives, Life Groups) |
| `live` | GET | (none) | 60 | Video: Resi live stream |
| `service-times` | GET | (none) | 300 | Image |
| `series-list` | GET | Sql | 300 | PosterList of series (`?channel=sermons` or `lifegroups`) |
| `series` | GET | Sql | 300 | PosterList of messages (`?id=<IdKey>` or `?id=current&channel=...`) |
| `watch` | GET | Sql | 300 | Video: one message's HLS URL (`?id=<IdKey>`) |

## Setup in Rock (prod)

1. **Admin Tools → CMS → Lava Applications → Add.**
   - Name: `Shepherd Church TV`
   - Slug: `tv`
   - Description: `JSON API for the Roku, Apple TV and Fire TV apps. Replaces the Crex plugin.`
   - Configuration: paste `configuration.json`.
   - Save.
2. **Security on the application** (lock icon): add **All Users** with
   **Execute View = Allow**. Leave Edit/Administrate alone. Without this,
   anonymous TVs get an access error.
3. **Add each endpoint** (Endpoints tab → Add) using the table above:
   - Name: e.g. `Home`; Slug: the endpoint name (`home`, `live`, ...)
   - HTTP Method: GET
   - Security Mode: **Application View**
   - Enabled Lava Commands: per the table
   - Caching Settings: public, max age per the table
   - Code Template: paste the matching file from `endpoints/`.
4. **Quick check** in a browser:
   `https://rock.shepherdchurch.net/api/v2/lava-app/1/tv/home`
   should show JSON starting with `{"Template": "Menu"`.

## Things to know

- **IDs are hard-coded** in the templates (channels 26/28, live schedule
  category 458, attribute Ids 8885/8887/8888/8914). They are commented at the top
  of each file. If a channel or attribute is ever recreated, update them there.
- **Changing the live stream, home background or service-times image**: edit the
  application's Configuration JSON. No app update needed.
- **Strings use `| ToJSON`**, which outputs a complete quoted, escaped string.
  Never wrap a `ToJSON` value in quotes, and never use `ToJSONSafeString`.
- **Items are listed with a leading comma** (`sep`) so there's never a trailing
  comma, which is what broke the old templates.
- Series and video links use Rock **IdKeys**, not raw Ids.
