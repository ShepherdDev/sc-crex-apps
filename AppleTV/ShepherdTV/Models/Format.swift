import Foundation

/// Date and time labels. A port of TV-Shared/src/api/format.ts.
/// Rock sends church-local times without a time zone ("2026-11-21T17:30:00").
/// We read the parts directly so the TV's own time zone setting can't shift them.
enum Format {
    private static let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    private static let days = ["Sunday", "Monday", "Tuesday", "Wednesday",
                               "Thursday", "Friday", "Saturday"]

    struct Parts { var y = 1970, m = 1, day = 1, hh = 0, mm = 0 }

    static func parts(_ iso: String) -> Parts {
        var p = Parts()
        let halves = iso.split(separator: "T", maxSplits: 1).map(String.init)
        let d = halves.first?.split(separator: "-").compactMap { Int($0) } ?? []
        if d.count == 3 { p.y = d[0]; p.m = d[1]; p.day = d[2] }
        if halves.count > 1 {
            let t = halves[1].split(separator: ":").compactMap { Int($0) }
            if t.count > 0 { p.hh = t[0] }
            if t.count > 1 { p.mm = t[1] }
        }
        return p
    }

    private static let utc: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }()

    /// Days since 1970 for the calendar date (no time zones involved).
    private static func dayNumber(_ p: Parts) -> Int {
        let date = utc.date(from: DateComponents(year: p.y, month: p.m, day: p.day)) ?? Date(timeIntervalSince1970: 0)
        return Int(date.timeIntervalSince1970 / 86400)
    }

    private static func weekday(_ p: Parts) -> String {
        let date = utc.date(from: DateComponents(year: p.y, month: p.m, day: p.day, hour: 12)) ?? Date()
        return days[utc.component(.weekday, from: date) - 1]
    }

    static func shortDate(_ iso: String) -> String {
        let p = parts(iso)
        return "\(months[max(0, min(11, p.m - 1))]) \(p.day)"
    }

    static func clockTime(_ hh: Int, _ mm: Int) -> String {
        let suffix = hh >= 12 ? "PM" : "AM"
        let h = hh % 12 == 0 ? 12 : hh % 12
        return mm == 0 ? "\(h) \(suffix)" : String(format: "%d:%02d %@", h, mm, suffix)
    }

    /// "Tonight, 6:45 PM", "Tomorrow, 8:45 AM", "Saturday, 5:30 PM".
    static func upcomingLabel(_ startIso: String, now nowIso: String) -> String {
        let s = parts(startIso), n = parts(nowIso)
        let daysAway = dayNumber(s) - dayNumber(n)
        let time = clockTime(s.hh, s.mm)
        if daysAway == 0 { return "\(s.hh >= 17 ? "Tonight" : "Today"), \(time)" }
        if daysAway == 1 { return "Tomorrow, \(time)" }
        if daysAway < 7 { return "\(weekday(s)), \(time)" }
        return "\(months[s.m - 1]) \(s.day), \(time)"
    }

    /// "5:30 PM" from "17:30:00".
    static func startTimeLabel(_ hhmmss: String) -> String {
        let t = hhmmss.split(separator: ":").compactMap { Int($0) }
        return clockTime(t.first ?? 0, t.count > 1 ? t[1] : 0)
    }

    static func messageMeta(date: String, speaker: String?) -> String {
        guard let speaker, !speaker.isEmpty else { return shortDate(date) }
        return "\(shortDate(date))  ·  \(speaker)"
    }

    static func minutesUntil(_ startIso: String, now nowIso: String) -> Int {
        let s = parts(startIso), n = parts(nowIso)
        return (dayNumber(s) * 1440 + s.hh * 60 + s.mm) - (dayNumber(n) * 1440 + n.hh * 60 + n.mm)
    }

    /// The "Next service in 3 hours" pill, counting down to the schedule time
    /// (when the stream goes live).
    static func nextServiceLabel(_ startIso: String, now nowIso: String) -> (lead: String, emphasis: String) {
        let mins = minutesUntil(startIso, now: nowIso)
        if mins <= 0 { return ("Next service", "starting now") }
        if mins < 60 { return ("Next service in", "\(mins) minute\(mins == 1 ? "" : "s")") }
        let hours = mins / 60
        if hours < 24 { return ("Next service in", "\(hours) hour\(hours == 1 ? "" : "s")") }
        return ("Next service", upcomingLabel(startIso, now: nowIso))
    }
}
