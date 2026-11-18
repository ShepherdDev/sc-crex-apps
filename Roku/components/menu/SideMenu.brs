sub init()
    m.cfg = AppConfig()
    m.top.findNode("rail").color = m.cfg.rail

    m.sections = [
        { section: "home", label: "Home", icon: "home" }
        { section: "live", label: "Watch Live", icon: "live" }
        { section: "series", label: "Series", icon: "series" }
        { section: "groups", label: "Life Groups", icon: "groups" }
    ]
    items = m.top.findNode("items")
    m.rows = []
    y = 0
    for each s in m.sections
        row = items.createChild("MenuItem")
        row.translation = [0, y]
        row.label = s.label
        row.icon = "pkg:/images/icon-" + s.icon + ".png"
        m.rows.Push(row)
        y = y + 84
    end for

    m.index = 0
    m.hadFocus = false
    m.top.observeField("focusedChild", "onFocusChanged")
    refresh()
end sub

' Coming into the menu lands on the section that's on screen.
sub onFocusChanged()
    focused = m.top.hasFocus()
    if focused and not m.hadFocus then m.index = indexOf(m.top.current)
    m.hadFocus = focused
    refresh()
end sub

sub refresh()
    if m.rows = invalid then return
    focused = m.top.hasFocus()
    for i = 0 to m.rows.Count() - 1
        row = m.rows[i]
        row.isCurrent = (m.sections[i].section = m.top.current)
        row.isFocused = focused and i = m.index
        row.showLive = (m.sections[i].section = "live" and m.top.isLive)
    end for
end sub

function indexOf(section as String) as Integer
    for i = 0 to m.sections.Count() - 1
        if m.sections[i].section = section then return i
    end for
    return 0
end function

function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false
    if key = "up" then
        if m.index > 0 then
            m.index = m.index - 1
            refresh()
        end if
        return true
    else if key = "down" then
        if m.index < m.rows.Count() - 1 then
            m.index = m.index + 1
            refresh()
        end if
        return true
    else if key = "OK" then
        m.top.selected = m.sections[m.index].section
        return true
    end if
    return false
end function
