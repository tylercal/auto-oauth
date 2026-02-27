(async function() {

    let example = document.getElementById("example")
    let choiceList = document.getElementById("choices")
    let host = ''
    let tab = null

    document.getElementById('cancel-auto').addEventListener("click", () => {
        window.top.postMessage("auto-cancel", "*") // close iFrame
        window.close() // close popup menu
    })

    function addAuto() {
        // 4. the user has selected their auto login, background will redirect after storing
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
            chrome.runtime.onMessage.removeListener(populate)
        }
    });

    // 1. determine what tab we're in
    let tabs = await chrome.tabs.query({active: true, currentWindow: true})
    tab = tabs[0]

    // 2. read the host directly from session storage, then inject the script to read the page
    let result = await chrome.storage.session.get(String(tab.id))
    host = result[String(tab.id)]
    if (host) {
        await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['src/script.js']})
    }
})()