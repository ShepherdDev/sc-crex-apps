# Shepherd Church TV API (Helix Lava Application)

The JSON API behind the new Roku, Apple TV and Fire TV apps. It replaces the
Blue Box Moon **Crex** plugin pages (`/api/crex/page/...`) with core Rock, so a
Rock upgrade can't break it the way a compiled plugin can.

Base URL: `https://rock.shepherdchurch.net/api/v2/lava-app/1/tv`

| Endpoint | Lava Commands | Cache | Returns |
|---|---|---|---|
| `home` | Rock Entity, Sql | 60 s | Live status, upcoming streams, banner message, home rows |
| `series` | Sql | 300 s | One series and its messages (`?id=<IdKey>` or `?id=current&channel=sermons\|lifegroups`) |
| `series-list` | Sql | 300 s | Every series with a published video (`?channel=sermons\|lifegroups`) |
| `message` | Sql | 300 s | One message by id (`?id=<IdKey>`), for deep links from the Roku home screen and search |

## Setup in Rock (prod)

1. **Admin Tools → CMS → Lava Applications → Add**
   - Name `Shepherd Church TV`, Slug `tv`
   - Configuration: paste `configuration.json`
2. **Application security** (lock icon): **All Users → Execute View → Allow**.
3. **Each endpoint** (Endpoints → Add):
   - Name and Slug: `home`, `series`, `series-list`, `message`
   - HTTP Method: **Get**
   - Security Mode: **Application View**
   - Enable Cross-Site Forgery Protection: **off** (TVs can't send the token; these are read-only)
   - Enabled Lava Commands: per the table
   - Advanced Settings → caching: public, max age per the table
   - Code Template: paste the file from `endpoints/`
4. Check `https://rock.shepherdchurch.net/api/v2/lava-app/1/tv/home` in a browser.

## Configuration (edit any time, no app update)

- `LiveStreamUrl`: the Resi HLS URL.
- `LiveScheduleIds`: schedules (from the Streaming category, 458) that turn on
  LIVE NOW and fill "Next live". The title shown is the schedule's
  **Description**, or its **Name** if the description is blank.
  Current list: Sundays 1459, Saturdays 1460, Weekday (Sun-Fri) 2114,
  Revival Nights 1931, Christmas Eve 1570, Christmas Eve Candlelight 1571,
  Christmas Eve Eve 2004, Christmas Day 1572, Easter Thursday 4158,
  Good Friday 1749, Easter Saturday Night 1750, Easter Sunday 1751.
- `TimeZone`: dates in responses are church local time.

## Response shapes

Message:
`{ "id", "title", "description", "date", "speaker", "image", "videoUrl", "seriesId", "seriesTitle" }`

Series:
`{ "id", "title", "description", "date", "image", "messageCount", "url" }`

`home`:
`{ "timeZone", "generatedAt", "live": {title, startTime, videoUrl} | null,
   "upcoming": [{start, title}], "hero": Message | null,
   "rows": [ {id, title, type: "messages"|"series", items: [...], seriesId?, seeAllUrl?} ] }`

`series`: `{ "series": Series, "messages": [Message] }`
`series-list`: `{ "title", "series": [Series] }`
`message`: `{ "message": Message }`
Errors: `{ "error": "..." }`

`image` is a Rock path (`/GetImage.ashx?Guid=...`); apps add the host and
`&maxwidth=` for the size they need. Dates are `yyyy-MM-ddTHH:mm:ss` local.

## Maintenance notes

- Hard-coded IDs (commented at the top of each file): channels 28 Sermons and
  26 Life Group Video Series; attributes 8885 series PosterImage, 8888 HLSVideo,
  8887 Speaker, 8914 message PosterImage.
- Strings use `| ToJSON` (a complete, escaped, quoted string). Never wrap it in
  quotes and never use `ToJSONSafeString`.
- Lists write the comma before each item (`sep`), so there's never a trailing comma.
- `check_tv_api.py` crawls every endpoint, series and message and reports
  anything invalid. Run it after any template change.
