sub init()
    m.cfg = AppConfig()
    m.body = m.top.findNode("body")
    m.bg = m.top.findNode("bg")
    m.iconImage = m.top.findNode("iconImage")
    m.text = m.top.findNode("text")
    m.liveBg = m.top.findNode("liveBg")
    m.liveText = m.top.findNode("liveText")
    m.liveBg.blendColor = m.cfg.red
    m.liveText.font = MakeFont(16, true)
    m.liveText.color = m.cfg.text
    m.regularFont = MakeFont(26)
    m.boldFont = MakeFont(26, true)
end sub

sub update()
    focused = m.top.isFocused
    current = m.top.isCurrent

    color = m.cfg.textMuted
    if focused then
        color = m.cfg.background
    else if current then
        color = m.cfg.blue
    end if

    m.text.text = m.top.label
    m.text.color = color
    if focused or current then
        m.text.font = m.boldFont
    else
        m.text.font = m.regularFont
    end if
    m.iconImage.uri = m.top.icon
    m.iconImage.blendColor = color

    m.bg.visible = focused or current
    if focused then
        m.bg.blendColor = m.cfg.text
        m.body.scale = [1.04, 1.04]
    else
        m.bg.blendColor = m.cfg.blueTint
        m.body.scale = [1.0, 1.0]
    end if

    m.liveBg.visible = m.top.showLive
    m.liveText.visible = m.top.showLive
    ' Leave room for the LIVE tag when it's showing.
    if m.top.showLive then
        m.text.width = 150
    else
        m.text.width = 226
    end if
end sub
