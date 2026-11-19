sub init()
    m.cfg = AppConfig()
    m.top.backgroundURI = ""
    m.top.backgroundColor = m.cfg.background

    m.screens = m.top.findNode("screens")
    m.menu = m.top.findNode("menu")
    m.menu.observeField("selected", "onMenuSelected")
    m.timer = m.top.findNode("homeTimer")
    m.timer.observeField("fire", "loadHome")

    m.stack = []          ' screen nodes, top of stack last
    m.section = ""
    m.homeData = invalid
    m.player = invalid
    m.launched = false

    showSection("home")
    focusScreen()
    loadHome()
    m.timer.control = "start"
end sub

' --- Home data ----------------------------------------------------------

sub loadHome()
    if m.player <> invalid then return  ' paused while something plays
    m.homeTask = StartApi("home", "onHome")
end sub

sub onHome(event as Object)
    res = event.getData()
    if res.ok then
        m.homeData = res.data
        m.menu.isLive = (res.data.live <> invalid)
        for each s in m.stack
            if s.subtype() = "HomeScreen" or s.subtype() = "LiveScreen" then s.home = res.data
        end for
    else
        print "[home] "; res.error
        for each s in m.stack
            if s.subtype() = "HomeScreen" then s.error = res.error
        end for
    end if
    if not m.launched then
        m.launched = true
        m.top.signalBeacon("AppLaunchComplete")
    end if
end sub

' --- Screens ------------------------------------------------------------

sub onMenuSelected()
    section = m.menu.selected
    if section <> m.section then showSection(section)
    focusScreen()
end sub

sub showSection(section as String)
    m.section = section
    m.menu.current = section
    m.screens.removeChildrenIndex(m.screens.getChildCount(), 0)
    m.stack = []

    if section = "home" then
        s = CreateObject("roSGNode", "HomeScreen")
        if m.homeData <> invalid then s.home = m.homeData
    else if section = "live" then
        s = CreateObject("roSGNode", "LiveScreen")
        if m.homeData <> invalid then s.home = m.homeData
    else if section = "series" then
        s = gridScreen("seriesList", "series-list?channel=sermons", "Series")
    else
        s = gridScreen("seriesList", "series-list?channel=lifegroups", "Life Groups")
    end if
    pushScreen(s)
end sub

function gridScreen(kind as String, path as String, heading as String) as Object
    s = CreateObject("roSGNode", "GridScreen")
    s.kind = kind
    s.path = path
    s.heading = heading
    s.load = true
    return s
end function

sub pushScreen(s as Object)
    if m.stack.Count() > 0 then m.stack.Peek().visible = false
    s.observeField("navigate", "onNavigate")
    m.screens.appendChild(s)
    m.stack.Push(s)
end sub

sub popScreen()
    s = m.stack.Pop()
    m.screens.removeChild(s)
    m.stack.Peek().visible = true
    focusScreen()
end sub

sub focusScreen()
    if m.stack.Count() > 0 then m.stack.Peek().setFocus(true)
end sub

sub onNavigate(event as Object)
    nav = event.getData()
    print "[nav] "; nav.name
    if nav.name = "play" then
        playMessage(nav.message)
    else if nav.name = "playLive" then
        playLive()
    else if nav.name = "series" then
        pushScreen(gridScreen("series", nav.path, ""))
        focusScreen()
    else if nav.name = "seriesList" then
        pushScreen(gridScreen("seriesList", nav.path, nav.title))
        focusScreen()
    else if nav.name = "retry" then
        loadHome()
    end if
end sub

' --- Player -------------------------------------------------------------

sub playMessage(message as Object)
    if message = invalid or message.videoUrl = invalid or message.videoUrl = "" then return
    content = CreateObject("roSGNode", "ContentNode")
    content.url = message.videoUrl
    content.title = message.title
    content.streamFormat = "hls"
    startPlayer(content)
end sub

sub playLive()
    if m.homeData = invalid or m.homeData.live = invalid then return
    content = CreateObject("roSGNode", "ContentNode")
    content.url = m.homeData.live.videoUrl
    content.title = m.homeData.live.title
    content.streamFormat = "hls"
    ' Live: never set a seek position. With a DVR window, seek = 0 jumps to the
    ' start of the window instead of the live point (the 1.2 bug).
    content.live = true
    startPlayer(content)
end sub

sub startPlayer(content as Object)
    m.timer.control = "stop"
    video = CreateObject("roSGNode", "Video")
    video.width = 1920
    video.height = 1080
    video.trickPlayBar.filledBarBlendColor = m.cfg.blue
    video.bufferingBar.filledBarBlendColor = m.cfg.blue
    video.retrievingBar.filledBarBlendColor = m.cfg.blue
    video.content = content
    video.observeField("state", "onPlayerState")
    m.top.appendChild(video)
    m.player = video
    m.loggedTracks = false
    video.setFocus(true)
    video.control = "play"
    print "[player] "; content.url
end sub

sub onPlayerState(event as Object)
    state = event.getData()
    print "[player] state "; state
    if state = "playing" and not m.loggedTracks then
        m.loggedTracks = true
        logCaptions()
    end if
    if state = "error" then
        print "[player] error "; m.player.errorCode; " "; m.player.errorMsg
        closePlayer()
    else if state = "finished" then
        closePlayer()
    end if
end sub

' Diagnostics for captions: what tracks the player found in the stream.
sub logCaptions()
    v = m.player
    print "[captions] global mode: "; v.globalCaptionMode
    print "[captions] current track: "; v.subtitleTrack
    tracks = v.availableSubtitleTracks
    if tracks = invalid or tracks.Count() = 0 then
        print "[captions] no subtitle tracks found"
    else
        for each t in tracks
            print "[captions] track: "; FormatJson(t)
        end for
    end if
end sub

sub closePlayer()
    if m.player = invalid then return
    m.player.control = "stop"
    m.top.removeChild(m.player)
    m.player = invalid
    focusScreen()
    loadHome()
    m.timer.control = "start"
end sub

' --- Keys ---------------------------------------------------------------

' Back: close the player, pop the screen, then go to the menu, then go Home,
' then exit (returning false lets Roku close the channel).
function onKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    if m.player <> invalid then
        if key = "back" then
            closePlayer()
            return true
        end if
        return false
    end if

    inMenu = m.menu.isInFocusChain()
    if key = "left" and not inMenu then
        m.menu.setFocus(true)
        return true
    else if key = "right" and inMenu then
        focusScreen()
        return true
    else if key = "back" then
        if m.stack.Count() > 1 then
            popScreen()
            return true
        else if not inMenu then
            m.menu.setFocus(true)
            return true
        else if m.section <> "home" then
            showSection("home")
            m.menu.setFocus(true)
            return true
        end if
    end if
    return false
end function
