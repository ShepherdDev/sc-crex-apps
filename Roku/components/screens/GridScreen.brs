sub init()
    m.cfg = AppConfig()
    m.title = m.top.findNode("title")
    m.subtitle = m.top.findNode("subtitle")
    m.status = m.top.findNode("status")
    m.grid = m.top.findNode("grid")
    m.title.font = MakeFont(48, true)
    m.title.color = m.cfg.text
    m.subtitle.font = MakeFont(24)
    m.subtitle.color = m.cfg.textDim
    m.status.font = MakeFont(30)
    m.status.color = m.cfg.textMuted
    m.grid.observeField("itemSelected", "onItemSelected")
    m.top.observeField("focusedChild", "onFocusChanged")
    m.failed = false
end sub

sub startLoad()
    m.title.text = m.top.heading
    m.subtitle.text = ""
    m.status.text = "Loading..."
    m.status.visible = true
    m.grid.visible = false
    m.failed = false
    m.task = StartApi(m.top.path, "onResponse")
end sub

sub onResponse(event as Object)
    res = event.getData()
    if not res.ok then
        m.failed = true
        m.status.text = res.error + Chr(10) + "Press OK to try again."
        return
    end if
    data = res.data
    root = CreateObject("roSGNode", "ContentNode")
    if m.top.kind = "series" then
        m.title.text = data.series.title
        m.subtitle.text = data.series.description
        m.grid.translation = [472, 260]
        for each msg in data.messages
            NewCardNode(root, "messages", msg, 326)
        end for
    else
        if data.title <> invalid and data.title <> "" then m.title.text = data.title
        m.grid.translation = [472, 200]
        for each s in data.series
            NewCardNode(root, "series", s, 326)
        end for
    end if
    if root.getChildCount() = 0 then
        m.status.text = "Nothing here yet."
        return
    end if
    m.status.visible = false
    m.grid.content = root
    m.grid.visible = true
    if m.top.isInFocusChain() then m.grid.setFocus(true)
end sub

sub onFocusChanged()
    if m.top.hasFocus() and m.grid.visible then m.grid.setFocus(true)
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press and key = "OK" and m.failed then
        startLoad()
        return true
    end if
    return false
end function

sub onItemSelected()
    item = m.grid.content.getChild(m.grid.itemSelected)
    if item = invalid then return
    if item.kind = "messages" then
        m.top.navigate = { name: "play", message: item.data }
    else if item.kind = "series" then
        m.top.navigate = { name: "series", path: item.data.url }
    end if
end sub
