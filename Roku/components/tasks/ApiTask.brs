sub init()
    m.top.functionName = "fetch"
end sub

sub fetch()
    cfg = AppConfig()
    path = m.top.path
    if LCase(Left(path, 4)) = "http" then
        url = path
    else if Left(path, 1) = "/" then
        url = cfg.rockHost + path
    else
        url = cfg.apiBase + "/" + path
    end if

    xfer = CreateObject("roUrlTransfer")
    port = CreateObject("roMessagePort")
    xfer.SetMessagePort(port)
    xfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    xfer.EnableEncodings(true)
    xfer.AddHeader("Accept", "application/json")
    xfer.SetUrl(url)

    started = CreateObject("roTimespan")
    if not xfer.AsyncGetToString() then
        finish(invalid, "We couldn't start the request.")
        return
    end if

    msg = wait(20000, port)
    if type(msg) <> "roUrlEvent" then
        xfer.AsyncCancel()
        print "[api] timed out: "; url
        finish(invalid, "Shepherd Church took too long to answer. Check your internet connection.")
        return
    end if

    code = msg.GetResponseCode()
    print "[api] "; code; " "; started.TotalMilliseconds(); "ms "; url
    if code <> 200 then
        print "[api] failure: "; msg.GetFailureReason()
        finish(invalid, "We couldn't reach Shepherd Church (error " + Str(code).Trim() + ").")
        return
    end if

    data = ParseJson(msg.GetString())
    if data = invalid then
        finish(invalid, "We got an answer we couldn't read.")
        return
    end if
    finish(data, "")
end sub

sub finish(data as Dynamic, errorText as String)
    m.top.response = { ok: (data <> invalid), data: data, error: errorText }
end sub
