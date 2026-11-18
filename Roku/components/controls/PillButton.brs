sub init()
    m.cfg = AppConfig()
    m.body = m.top.findNode("body")
    m.bg = m.top.findNode("bg")
    m.label = m.top.findNode("label")
    m.label.font = MakeFont(28, true)
end sub

sub update()
    if m.label = invalid then return
    m.label.text = m.top.text
    ' Size to the words: measure the label, then add padding.
    m.label.width = 0
    textWidth = m.label.boundingRect().width
    w = textWidth + 96
    if w < 240 then w = 240
    m.label.width = w
    m.bg.width = w
    m.top.buttonWidth = w
    m.body.scaleRotateCenter = [w / 2, 36]

    if m.top.isFocused then
        m.bg.blendColor = m.cfg.text
        m.label.color = m.cfg.background
        m.body.scale = [1.05, 1.05]
    else
        if m.top.primary then
            m.bg.blendColor = m.cfg.blue
            m.label.color = m.cfg.background
        else
            m.bg.blendColor = "0xFFFFFF26"
            m.label.color = m.cfg.text
        end if
        m.body.scale = [1.0, 1.0]
    end if
end sub
