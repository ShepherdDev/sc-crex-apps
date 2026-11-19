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
    m.slide = m.top.findNode("slide")
    m.rowsMove = m.top.findNode("rowsMove")
    m.heroFade = m.top.findNode("heroFade")
    m.slidUp = false

    m.liveBadge = m.top.findNode("liveBadge")
    m.liveBadgeBg = m.top.findNode("liveBadgeBg")
    m.liveBadgeText = m.top.findNode("liveBadgeText")
    m.liveBadgeBg.blendColor = m.cfg.red
    m.top.findNode("liveDot").blendColor = m.cfg.text
    m.liveBadgeText.font = MakeFont(24, true)
    m.liveBadgeText.color = m.cfg.text
    m.liveBadgeText.width = 0
    m.liveBadgeBg.width = 40 + m.liveBadgeText.boundingRect().width + 16
    m.heroTitle.font = MakeFont(84, true)
    m.heroTitle.color = m.cfg.text
    m.heroMeta.font = MakeFont(28)
    m.heroMeta.color = m.cfg.textMuted
    m.heroDesc.font = MakeFont(26)
    m.heroDesc.color = "0xE3E6EAFF"
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
    key = FormatJson({ hero: hero, live: live })
    if key = m.heroKey then return
    m.heroKey = key

    m.heroArt.uri = ""
    if hero <> invalid then m.heroArt.uri = ImageUrl(hero.image, 1160)

    actions = []
    if live <> invalid then
        ' Live: the stream is front and center, with one button.
        m.liveBadge.visible = true
        m.heroSeries.font = MakeFont(28)
        m.heroSeries.color = m.cfg.textMuted
        m.heroSeries.text = "Started at " + StartTimeLabel(live.startTime)
        m.heroSeries.translation = [m.liveBadgeBg.width + 16, 0]
        m.heroTitle.text = live.title
        m.heroMeta.text = "Streaming live from Shepherd Church"
        m.heroDesc.text = ""
        actions.Push({ text: "Join Live", action: { name: "playLive" }, primary: true })
    else if hero <> invalid then
        m.liveBadge.visible = false
        m.heroSeries.font = MakeFont(24, true)
        m.heroSeries.color = m.cfg.blue
        m.heroSeries.text = "LATEST MESSAGE"
        m.heroSeries.translation = [0, 0]
        m.heroTitle.text = hero.title
        meta = []
        if hero.seriesTitle <> invalid and hero.seriesTitle <> "" then meta.Push(hero.seriesTitle)
        if hero.speaker <> invalid and hero.speaker <> "" then meta.Push(hero.speaker)
        m.heroMeta.text = meta.Join("  ·  ")
        m.heroDesc.text = hero.description
        actions.Push({ text: "Watch Now", action: { name: "play", message: hero }, primary: true })
        if hero.seriesId <> invalid and hero.seriesId <> "" then
            actions.Push({ text: "View Series", action: { name: "series", path: "series?id=" + hero.seriesId }, primary: false })
        end if
    else
        m.liveBadge.visible = false
        m.heroSeries.text = ""
        m.heroTitle.text = "Shepherd Church"
        m.heroMeta.text = ""
        m.heroDesc.text = ""
    end if

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

sub onContinue()
    if m.top.home <> invalid then
        updateRows(m.top.home)
        applyFocus()
    end if
end sub

sub updateRows(home as Object)
    progress = m.top.continueWatching
    if progress = invalid then progress = []
    key = FormatJson({ rows: home.rows, progress: progress })
    if key = m.rowsKey then return
    m.rowsKey = key

    ' Rebuilding resets the list's position, so remember where focus was.
    focused = m.rows.rowItemFocused
    root = CreateObject("roSGNode", "ContentNode")
    if progress.Count() > 0 then
        r = root.createChild("ContentNode")
        r.title = "Continue Watching"
        for each p in progress
            NewProgressNode(r, p, 400)
        end for
    end if
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
    if m.area = "rows" and focused <> invalid and focused.Count() = 2 then
        row = focused[0]
        if row >= root.getChildCount() then row = root.getChildCount() - 1
        if row >= 0 then m.rows.jumpToRowItem = [row, 0]
    end if
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
    slideTo(m.area = "rows")
    if inScreen and m.area = "rows" and not m.rows.hasFocus() then m.rows.setFocus(true)
    if inScreen and m.area <> "rows" and m.rows.hasFocus() then m.top.setFocus(true)
end sub

sub slideTo(up as Boolean)
    if up = m.slidUp then return
    m.slidUp = up
    m.slide.control = "stop"
    if up then
        m.rowsMove.keyValue = [m.rows.translation, [472, 120]]
        m.heroFade.keyValue = [m.hero.opacity, 0.0]
    else
        m.rowsMove.keyValue = [m.rows.translation, [472, 716]]
        m.heroFade.keyValue = [m.hero.opacity, 1.0]
    end if
    m.slide.control = "start"
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
