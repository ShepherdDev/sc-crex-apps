sub init()
    m.cfg = AppConfig()
    m.heading = m.top.findNode("heading")
    m.detail = m.top.findNode("detail")
    m.action = m.top.findNode("action")
    m.heading.font = MakeFont(56, true)
    m.heading.color = m.cfg.text
    m.detail.font = MakeFont(30)
    m.detail.color = m.cfg.textMuted
    m.actionNav = invalid
    m.top.observeField("focusedChild", "onFocusChanged")
end sub

sub update()
    home = m.top.home
    if home = invalid then return
    if home.live <> invalid then
        m.heading.text = "We're live"
        m.detail.text = home.live.title + "  ·  Started at " + StartTimeLabel(home.live.startTime)
        m.action.text = "Join Live"
        m.actionNav = { name: "playLive" }
    else
        m.heading.text = "We're not live right now"
        if home.upcoming <> invalid and home.upcoming.Count() > 0 then
            label = NextServiceLabel(home.upcoming[0].start, home.generatedAt)
            m.detail.text = label.lead + " " + label.emphasis + "  ·  " + home.upcoming[0].title
        else
            m.detail.text = ""
        end if
        if home.hero <> invalid and home.hero.seriesId <> invalid then
            m.action.text = "Catch Up on Our Latest Series"
            m.actionNav = { name: "series", path: "series?id=" + home.hero.seriesId }
        else
            m.actionNav = invalid
        end if
    end if
    m.action.visible = (m.actionNav <> invalid)
end sub

sub onFocusChanged()
    m.action.isFocused = m.top.hasFocus()
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press and key = "OK" and m.actionNav <> invalid then
        m.top.navigate = m.actionNav
        return true
    end if
    return false
end function
