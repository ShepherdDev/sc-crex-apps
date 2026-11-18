sub init()
    m.cfg = AppConfig()
    m.hero = m.top.findNode("hero")
    m.heroArt = m.top.findNode("heroArt")
    m.heroSeries = m.top.findNode("heroSeries")
    m.heroTitle = m.top.findNode("heroTitle")
    m.heroMeta = m.top.findNode("heroMeta")
    m.heroDesc = m.top.findNode("heroDesc")
    m.buttonGroup = m.top.findNode("buttons")
    m.pill = m.top.findNode("pill")
    m.pillBg = m.top.findNode("pillBg")
    m.pillLead = m.top.findNode("pillLead")
    m.pillEmphasis = m.top.findNode("pillEmphasis")
    m.rows = m.top.findNode("rows")
    m.errorView = m.top.findNode("errorView")
    m.errorText = m.top.findNode("errorText")
    m.retry = m.top.findNode("retry")

    m.heroSeries.font = MakeFont(24, true)
    m.heroSeries.color = m.cfg.blue
    m.heroTitle.font = MakeFont(56, true)
    m.heroTitle.color = m.cfg.text
    m.heroMeta.font = MakeFont(24)
    m.heroMeta.color = m.cfg.textMuted
    m.heroDesc.font = MakeFont(24)
    m.heroDesc.color = m.cfg.textDim
    m.pillBg.blendColor = "0x1A1D21E6"
    m.pillLead.font = MakeFont(24)
    m.pillLead.color = m.cfg.textMuted
    m.pillEmphasis.font = MakeFont(24, true)
    m.pillEmphasis.color = m.cfg.text
    m.errorText.font = MakeFont(32)
    m.errorText.color = m.cfg.textMuted

    m.rows.rowLabelFont = MakeFont(30, true)
    m.rows.rowLabelColor = m.cfg.text
    m.rows.observeField("rowItemSelected", "onRowItemSelected")

    m.buttons = []      ' [{ node, action }]
    m.buttonIndex = 0
    m.area = "buttons"  ' where focus is inside this screen: buttons | rows | error
    m.rowsKey = ""
    m.heroKey = ""

    m.top.observeField("focusedChild", "onFocusChanged")
end sub

' --- Data ---------------------------------------------------------------

sub onHome()
    home = m.top.home
    if home = invalid then return
    m.errorView.visible = false
    m.hero.visible = true
    m.rows.visible = true
    if m.area = "error" then m.area = "buttons"

    updateHero(home)
    updatePill(home)
    updateRows(home)
    if m.buttons.Count() = 0 and m.area = "buttons" then m.area = "rows"
    applyFocus()
end sub

sub updateHero(home as Object)
    hero = home.hero
    live = home.live
    ' Only rebuild when something changed, so a refresh doesn't move focus.
    key = FormatJson({ hero: hero, live: (live <> invalid) })
    if key = m.heroKey then return
    m.heroKey = key

    if hero <> invalid then
        m.heroArt.uri = ImageUrl(hero.image, 1160)
        m.heroSeries.text = UCase(hero.seriesTitle)
        m.heroTitle.text = hero.title
        m.heroMeta.text = MessageMeta(hero.date, hero.speaker)
        m.heroDesc.text = hero.description
    else
        m.heroArt.uri = ""
        m.heroSeries.text = ""
        m.heroTitle.text = "Shepherd Church"
        m.heroMeta.text = ""
        m.heroDesc.text = ""
    end if

    actions = []
    if live <> invalid then actions.Push({ text: "Watch Live", action: { name: "playLive" }, primary: true })
    if hero <> invalid then actions.Push({ text: "Watch Now", action: { name: "play", message: hero }, primary: (live = invalid) })

    m.buttonGroup.removeChildrenIndex(m.buttonGroup.getChildCount(), 0)
    m.buttons = []
    x = 0
    for each a in actions
        b = m.buttonGroup.createChild("PillButton")
        b.primary = a.primary
        b.text = a.text
        b.translation = [x, 0]
        x = x + b.buttonWidth + 24
        m.buttons.Push({ node: b, action: a.action })
    end for
    if m.buttonIndex >= m.buttons.Count() then m.buttonIndex = 0
end sub

' "Next service in 3 hours", top right, when we're not live.
sub updatePill(home as Object)
    if home.live <> invalid or home.upcoming = invalid or home.upcoming.Count() = 0 then
        m.pill.visible = false
        return
    end if
    label = NextServiceLabel(home.upcoming[0].start, home.generatedAt)
    m.pillLead.text = label.lead
    m.pillEmphasis.text = label.emphasis
    m.pillLead.width = 0
    m.pillEmphasis.width = 0
    leadW = m.pillLead.boundingRect().width
    emW = m.pillEmphasis.boundingRect().width
    pad = 28
    w = pad + leadW + 10 + emW + pad
    m.pillBg.width = w
    m.pillLead.translation = [pad, 0]
    m.pillEmphasis.translation = [pad + leadW + 10, 0]
    m.pill.translation = [1920 - 96 - w, 64]
    m.pill.visible = true
end sub

sub updateRows(home as Object)
    key = FormatJson(home.rows)
    if key = m.rowsKey then return
    m.rowsKey = key

    root = CreateObject("roSGNode", "ContentNode")
    for each row in home.rows
        if row.items <> invalid and row.items.Count() > 0 then
            r = root.createChild("ContentNode")
            r.title = row.title
            for each item in row.items
                NewCardNode(r, row.type, item, 400)
            end for
            if row.seeAllUrl <> invalid and row.seeAllUrl <> "" then
                NewCardNode(r, "seeall", { url: row.seeAllUrl, title: row.title }, 400)
            end if
        end if
    end for
    m.rows.content = root
end sub

sub onError()
    if m.top.error = "" then return
    ' Keep showing what we had if a background refresh fails.
    if m.top.home <> invalid then return
    m.hero.visible = false
    m.rows.visible = false
    m.errorText.text = m.top.error
    m.errorView.visible = true
    m.area = "error"
    applyFocus()
end sub

' --- Focus --------------------------------------------------------------

sub onFocusChanged()
    ' Focus arriving on the screen itself: pass it to the right part.
    if m.top.hasFocus() and m.area = "rows" then
        m.rows.setFocus(true)
        return
    end if
    applyFocus()
end sub

sub applyFocus()
    inScreen = m.top.isInFocusChain()
    for i = 0 to m.buttons.Count() - 1
        m.buttons[i].node.isFocused = inScreen and m.area = "buttons" and i = m.buttonIndex
    end for
    m.retry.isFocused = inScreen and m.area = "error"

    ' With focus in the rows, slide them up over the hero so more rows fit.
    if m.area = "rows" then
        m.rows.translation = [472, 120]
        m.hero.opacity = 0
    else
        m.rows.translation = [472, 716]
        m.hero.opacity = 1
    end if
    if inScreen and m.area = "rows" and not m.rows.hasFocus() then m.rows.setFocus(true)
    if inScreen and m.area <> "rows" and m.rows.hasFocus() then m.top.setFocus(true)
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    if m.area = "error" then
        if key = "OK" then
            m.top.navigate = { name: "retry" }
            return true
        end if
        return false
    end if

    if m.area = "buttons" then
        if key = "OK" and m.buttons.Count() > 0 then
            m.top.navigate = m.buttons[m.buttonIndex].action
            return true
        else if key = "right" and m.buttonIndex < m.buttons.Count() - 1 then
            m.buttonIndex = m.buttonIndex + 1
            applyFocus()
            return true
        else if key = "left" and m.buttonIndex > 0 then
            m.buttonIndex = m.buttonIndex - 1
            applyFocus()
            return true
        else if key = "down" and m.rows.content <> invalid then
            m.area = "rows"
            applyFocus()
            return true
        end if
        return false
    end if

    ' Rows: Up from the first row goes back to the buttons.
    if key = "up" and m.buttons.Count() > 0 then
        m.area = "buttons"
        applyFocus()
        return true
    end if
    return false
end function

sub onRowItemSelected()
    sel = m.rows.rowItemSelected
    row = m.rows.content.getChild(sel[0])
    if row = invalid then return
    item = row.getChild(sel[1])
    if item = invalid then return
    if item.kind = "messages" then
        m.top.navigate = { name: "play", message: item.data }
    else if item.kind = "series" then
        m.top.navigate = { name: "series", path: item.data.url }
    else if item.kind = "seeall" then
        m.top.navigate = { name: "seriesList", path: item.data.url, title: item.data.title }
    end if
end sub
