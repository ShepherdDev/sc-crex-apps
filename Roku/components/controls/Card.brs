sub init()
    m.cfg = AppConfig()
    m.placeholder = m.top.findNode("placeholder")
    m.art = m.top.findNode("art")
    m.fade = m.top.findNode("fade")
    m.title = m.top.findNode("title")
    m.meta = m.top.findNode("meta")
    m.seeAll = m.top.findNode("seeAll")
    m.track = m.top.findNode("track")
    m.bar = m.top.findNode("bar")
    m.mask = m.top.findNode("mask")
    m.bar.color = m.cfg.blue
    m.progress = 0
    m.placeholder.color = m.cfg.surface
    m.title.color = m.cfg.text
    m.meta.color = m.cfg.textMuted
    m.seeAll.color = m.cfg.text
    m.seeAll.font = MakeFont(28, true)
    m.title.font = MakeFont(24, true)
    m.meta.font = MakeFont(18)
end sub

sub onContent()
    c = m.top.itemContent
    if c = invalid then return
    kind = c.kind
    m.seeAll.visible = (kind = "seeall")
    m.art.visible = (kind <> "seeall")
    isMessage = (kind = "messages")
    m.fade.visible = isMessage
    m.title.visible = isMessage
    m.meta.visible = isMessage

    m.progress = 0
    if c.hasField("progress") then m.progress = c.progress
    m.track.visible = (m.progress > 0)
    m.bar.visible = (m.progress > 0)

    if kind = "seeall" then
        m.seeAll.text = "See All"
    else
        m.art.uri = c.hdPosterUrl
        if isMessage then
            m.title.text = c.title
            m.meta.text = c.shortDescriptionLine2
        end if
    end if
    layout()
end sub

sub layout()
    w = m.top.width
    h = m.top.height
    if w <= 0 or h <= 0 then return
    m.placeholder.width = w
    m.placeholder.height = h
    m.art.width = w
    m.art.height = h
    ' Decode the art at card size, not full size, to save image memory.
    m.art.loadWidth = w
    m.art.loadHeight = h
    m.fade.width = w
    m.fade.height = h * 0.7
    m.fade.translation = [0, h * 0.3]
    pad = 18
    m.title.width = w - pad * 2
    m.title.height = h - pad - 30
    m.title.translation = [pad, 0]
    m.meta.width = w - pad * 2
    m.meta.translation = [pad, h - pad - 26]
    m.seeAll.width = w
    m.seeAll.height = h
    m.track.width = w
    m.track.translation = [0, h - 6]
    m.bar.width = w * m.progress
    m.bar.translation = [0, h - 6]
    m.mask.width = w
    m.mask.height = h
end sub
