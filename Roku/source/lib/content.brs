' Turns API items into ContentNodes for RowList / MarkupGrid.
' Each node keeps the original item in "data" and its type in "kind":
'   messages | series | seeall

function NewCardNode(parent as Object, kind as String, data as Object, imageWidth as Integer) as Object
    node = parent.createChild("ContentNode")
    node.addFields({ kind: kind, data: data })
    if kind = "messages" then
        node.title = data.title
        node.shortDescriptionLine2 = MessageMeta(data.date, data.speaker)
        node.hdPosterUrl = ImageUrl(data.image, imageWidth)
    else if kind = "series" then
        node.title = data.title
        node.hdPosterUrl = ImageUrl(data.image, imageWidth)
    else
        node.title = "See All"
    end if
    return node
end function
