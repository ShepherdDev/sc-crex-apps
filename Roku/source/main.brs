' Shepherd Church Roku channel, 2.0.
' Everything visual lives in MainScene. This opens the screen, passes along
' deep links (Roku home screen, search, voice, certification tests), and waits.
'
' Deep links: mediaType "episode" + contentId <message id> plays a message;
' mediaType "series" + contentId <series id> opens a series;
' mediaType "live" (any contentId) opens the live stream.
sub Main(args as Dynamic)
    screen = CreateObject("roSGScreen")
    port = CreateObject("roMessagePort")
    screen.setMessagePort(port)

    scene = screen.CreateScene("MainScene")
    screen.show()

    if args <> invalid and args.contentId <> invalid and args.mediaType <> invalid then
        scene.deepLink = { contentId: args.contentId, mediaType: args.mediaType }
    end if

    ' Deep links that arrive while the channel is already running.
    input = CreateObject("roInput")
    input.SetMessagePort(port)

    while true
        msg = wait(0, port)
        msgType = type(msg)
        if msgType = "roSGScreenEvent" then
            if msg.isScreenClosed() then return
        else if msgType = "roInputEvent" then
            if msg.IsInput() then
                info = msg.GetInfo()
                if info.contentId <> invalid and info.mediaType <> invalid then
                    scene.deepLink = { contentId: info.contentId, mediaType: info.mediaType }
                end if
            end if
        end if
    end while
end sub
