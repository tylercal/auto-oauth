(function() {
    let frame = document.createElement('iframe')
    frame.src = chrome.extension.getURL("src/menu.html")
    frame.style.position = 'fixed'
    frame.style.zIndex = '9999999'
    frame.style.width = '100%'
    frame.style.height = '100%'
    frame.id = 'auto-oauth-frame'
    document.body.insertBefore(frame, document.body.firstChild)

    window.addEventListener("message", ev => {
        if (ev.data === "auto-cancel") document.getElementById('auto-oauth-frame').remove()
    })
})()