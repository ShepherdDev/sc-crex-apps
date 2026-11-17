# Rock-side Crex templates

The TV apps render whatever JSON Rock returns from `/api/crex/page/...`.
If that JSON is invalid, Crex returns `"Items": null` and the apps show a
blank screen (Roku crashes outright).

## Bug (Nov 2026)
The original templates (`original/`) wrapped strings like
`"{{ Item.Title | ToJSONSafeString }}"`. That filter does not escape straight
double quotes, so any title/description/speaker with `"` produced invalid JSON.
They also left a trailing comma after the last item.

## Fix
`ItemChildren-Template.lava` -> page 1243, block "Crex Content Channel Item Children" (Id 2137), Template setting
`ChannelView-Template.lava`  -> page 1241, block "Crex Content Channel View" (Id 2136), Template setting

Strings now use `{{ value | ToJSON }}` (emits a complete quoted, escaped
string, so it is NOT wrapped in quotes) and commas are written before each item.

Test: https://<rock>/api/crex/page/1243?ContentItemId=4884 should return
4 items including `From Loneliness to \"God With Us\"`.
