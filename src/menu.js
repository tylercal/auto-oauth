(function() {

    let example = document.getElementById("example")
    let choiceList = document.getElementById("choices")
    let host = ''
    let tab = null

    document.getElementById('cancel-auto').addEventListener("click", () => {
        window.top.postMessage("auto-cancel", "*") // close iFrame
        window.close() // close popup menu
    })

    function addAuto() {
        // 4. the user as selected their auto login, background will redirect after storing
        document.getElementById('done').classList.remove('d-none')
        document.querySelectorAll('button').forEach(btn => {
            btn.classList.add('d-none')
        })
        chrome.runtime.sendMessage({addAuto: this.innerText, host: host, tab: tab})
        setTimeout(()=>{window.close()}, 1500)
    }

    chrome.runtime.onMessage.addListener(function populate(request, sender) {
        if (request.options && sender.tab.id === tab.id) {
            // 3. the script reads the options on the page, render them in the popup menu
            document.getElementById('host').innerText = host
            request.options.forEach((option) => {
                let button = example.cloneNode(true)
                button.classList.remove('d-none')
                button.id = ''
                button.innerText = option
                button.addEventListener('click', addAuto)
                choiceList.append(button)
            })
            chrome.runtime.onMessage.removeListener(populate) // Everything is filled out, no more updates
        } else if (request.requestedHost) {
            // 2. background.js responses with the host for this tab, inject the script file to read the page
            if (request.requestedHost.tabId === tab.id) {
                host = request.requestedHost.host
                chrome.tabs.executeScript({file: 'src/script.js'})
            }
        }
    });

    chrome.tabs.query( {active: true, currentWindow: true}, tabs => {
        // 1. determine what tab we're in and request the host for that tab from background.js
        tab = tabs[0]
        chrome.runtime.sendMessage({hostForTabId: tab.id})
    })
})();