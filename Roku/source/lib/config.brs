' Shared settings and small helpers. Included by every component that needs them.

function AppConfig() as Object
    host = "https://rock.shepherdchurch.net"
    return {
        rockHost: host
        apiBase: host + "/api/v2/lava-app/1/tv"
        ' Layout (1920x1080 design, same numbers as the Fire TV app)
        menuWidth: 400
        sideMargin: 72
        ' Colors (Shepherd screen values on the dark TV theme)
        background: "0x0B0C0EFF"
        surface: "0x1A1D21FF"
        rail: "0x060708FF"
        text: "0xFFFFFFFF"
        textMuted: "0xC9CDD2FF"
        textDim: "0xA9AEB5FF"
        blue: "0x43B2E5FF"
        red: "0x9F1C20FF"
        blueTint: "0x43B2E524"
    }
end function

' Full URL for a Rock image path, asking Rock for a copy sized for where it's
' shown so big originals don't use up the Roku's image memory.
function ImageUrl(path as Dynamic, width as Integer) as String
    if path = invalid or path = "" then return ""
    url = path
    if LCase(Left(url, 4)) <> "http" then url = AppConfig().rockHost + url
    if Instr(1, url, "GetImage.ashx") > 0 then
        sep = "?"
        if Instr(1, url, "?") > 0 then sep = "&"
        url = url + sep + "width=" + Str(width).Trim()
    end if
    return url
end function

' A system font at a given size.
function MakeFont(size as Integer, bold = false as Boolean) as Object
    font = CreateObject("roSGNode", "Font")
    if bold then
        font.uri = "font:BoldSystemFontFile"
    else
        font.uri = "font:SystemFontFile"
    end if
    font.size = size
    return font
end function

' Starts a request to the TV API. The task's "response" field gets
' { ok, data, error } when it finishes. Keep the returned task in m.
function StartApi(path as String, callback as String) as Object
    task = CreateObject("roSGNode", "ApiTask")
    task.path = path
    task.observeField("response", callback)
    task.control = "RUN"
    return task
end function
