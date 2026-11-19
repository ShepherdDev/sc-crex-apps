' Partly watched messages, saved on this Roku only (port of TV-Shared/src/storage/progress.ts).
' Roku gives each channel 16 KB of registry space, so we keep only the fields
' the cards and player need, never descriptions.

function ProgressKeys() as Object
    return { section: "shepherd", key: "progress.v1", maxItems: 20, minPosition: 60, endMargin: 300 }
end function

function LoadProgress() as Object
    k = ProgressKeys()
    reg = CreateObject("roRegistrySection", k.section)
    if not reg.Exists(k.key) then return []
    items = ParseJson(reg.Read(k.key))
    if type(items) <> "roArray" then return []
    return items
end function

sub WriteProgress(items as Object)
    k = ProgressKeys()
    reg = CreateObject("roRegistrySection", k.section)
    reg.Write(k.key, FormatJson(items))
    reg.Flush()
end sub

' Seconds to resume at, or 0.
function ResumePosition(messageId as String) as Integer
    for each p in LoadProgress()
        if p.message.id = messageId then return p.position
    end for
    return 0
end function

' Ignore the first minute and the last five (people who barely started or finished).
sub SaveProgress(message as Object, position as Integer, duration as Integer)
    k = ProgressKeys()
    items = []
    for each p in LoadProgress()
        if p.message.id <> message.id then items.Push(p)
    end for

    if position >= k.minPosition and duration > 0 and position < duration - k.endMargin then
        trimmed = {
            id: message.id
            title: message.title
            image: message.image
            videoUrl: message.videoUrl
            date: message.date
            speaker: message.speaker
            seriesId: message.seriesId
            seriesTitle: message.seriesTitle
        }
        dt = CreateObject("roDateTime")
        items.Unshift({ message: trimmed, position: position, duration: duration, updatedAt: dt.AsSeconds() })
    end if

    while items.Count() > k.maxItems
        items.Pop()
    end while
    WriteProgress(items)
end sub
