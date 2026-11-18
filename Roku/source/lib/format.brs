' Date and time labels. A port of TV-Shared/src/api/format.ts.
' Rock sends church-local times without a time zone ("2026-11-21T17:30:00").
' We read the parts directly so the TV's own time zone setting can't shift them.

function FmtMonths() as Object
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
end function

function FmtParts(iso as String) as Object
    p = { y: 1970, m: 1, day: 1, hh: 0, mm: 0 }
    halves = iso.Split("T")
    d = halves[0].Split("-")
    if d.Count() = 3 then
        p.y = d[0].ToInt()
        p.m = d[1].ToInt()
        p.day = d[2].ToInt()
    end if
    if halves.Count() > 1 then
        t = halves[1].Split(":")
        p.hh = t[0].ToInt()
        if t.Count() > 1 then p.mm = t[1].ToInt()
    end if
    return p
end function

' Days since 1970-01-01 for a calendar date (no time zones involved).
function FmtDayNumber(p as Object) as Integer
    dt = CreateObject("roDateTime")
    dt.FromISO8601String(p.y.ToStr() + "-" + Right("0" + p.m.ToStr(), 2) + "-" + Right("0" + p.day.ToStr(), 2) + "T00:00:00Z")
    return Int(dt.AsSeconds() / 86400)
end function

function FmtWeekday(p as Object) as String
    dt = CreateObject("roDateTime")
    dt.FromISO8601String(p.y.ToStr() + "-" + Right("0" + p.m.ToStr(), 2) + "-" + Right("0" + p.day.ToStr(), 2) + "T12:00:00Z")
    return dt.GetWeekday()
end function

function ShortDate(iso as String) as String
    p = FmtParts(iso)
    return FmtMonths()[p.m - 1] + " " + p.day.ToStr()
end function

function ClockTime(hh as Integer, mm as Integer) as String
    suffix = "AM"
    if hh >= 12 then suffix = "PM"
    h = hh mod 12
    if h = 0 then h = 12
    if mm = 0 then return h.ToStr() + " " + suffix
    return h.ToStr() + ":" + Right("0" + mm.ToStr(), 2) + " " + suffix
end function

' "Tonight, 6:45 PM", "Tomorrow, 8:45 AM", "Saturday, 5:30 PM", relative to nowIso (church time).
function UpcomingLabel(startIso as String, nowIso as String) as String
    s = FmtParts(startIso)
    n = FmtParts(nowIso)
    daysAway = FmtDayNumber(s) - FmtDayNumber(n)
    time = ClockTime(s.hh, s.mm)
    if daysAway = 0 then
        if s.hh >= 17 then return "Tonight, " + time
        return "Today, " + time
    end if
    if daysAway = 1 then return "Tomorrow, " + time
    if daysAway < 7 then return FmtWeekday(s) + ", " + time
    return FmtMonths()[s.m - 1] + " " + s.day.ToStr() + ", " + time
end function

' "5:30 PM" from "17:30:00".
function StartTimeLabel(hhmmss as String) as String
    t = hhmmss.Split(":")
    mm = 0
    if t.Count() > 1 then mm = t[1].ToInt()
    return ClockTime(t[0].ToInt(), mm)
end function

function MessageMeta(date as Dynamic, speaker as Dynamic) as String
    if date = invalid or date = "" then
        if speaker = invalid then return ""
        return speaker
    end if
    if speaker = invalid or speaker = "" then return ShortDate(date)
    return ShortDate(date) + "  ·  " + speaker
end function

' Minutes from nowIso to startIso, both church local time.
function MinutesUntil(startIso as String, nowIso as String) as Integer
    s = FmtParts(startIso)
    n = FmtParts(nowIso)
    startMin = FmtDayNumber(s) * 1440 + s.hh * 60 + s.mm
    nowMin = FmtDayNumber(n) * 1440 + n.hh * 60 + n.mm
    return startMin - nowMin
end function

' The "Next service in 3 hours" pill, counting down to the schedule time
' (when the stream goes live). Returns { lead, emphasis }.
function NextServiceLabel(startIso as String, nowIso as String) as Object
    mins = MinutesUntil(startIso, nowIso)
    if mins <= 0 then return { lead: "Next service", emphasis: "starting now" }
    if mins < 60 then
        unit = " minutes"
        if mins = 1 then unit = " minute"
        return { lead: "Next service in", emphasis: mins.ToStr() + unit }
    end if
    hours = Int(mins / 60)
    if hours < 24 then
        unit = " hours"
        if hours = 1 then unit = " hour"
        return { lead: "Next service in", emphasis: hours.ToStr() + unit }
    end if
    return { lead: "Next service", emphasis: UpcomingLabel(startIso, nowIso) }
end function

' Church-local "now" as an ISO string: the server's generatedAt plus however
' long ago we fetched it. Avoids trusting the TV's clock or time zone.
function ChurchNow(generatedAt as String, secondsSinceFetch as Integer) as String
    p = FmtParts(generatedAt)
    total = p.hh * 3600 + p.mm * 60 + secondsSinceFetch
    dt = CreateObject("roDateTime")
    dt.FromSeconds(FmtDayNumber(p) * 86400 + total)
    return dt.GetYear().ToStr() + "-" + Right("0" + dt.GetMonth().ToStr(), 2) + "-" + Right("0" + dt.GetDayOfMonth().ToStr(), 2) + "T" + Right("0" + dt.GetHours().ToStr(), 2) + ":" + Right("0" + dt.GetMinutes().ToStr(), 2) + ":00"
end function
