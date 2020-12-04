let autoLogins = {}

function autoHost(url) {
    return new URL((new URLSearchParams(url)).get('redirect_uri')).host
}

function updateItems() {
    chrome.storage.sync.get(items => {
        autoLogins = items
    })
}

function redirect(tab, hint) {
    let redirect = tab.url+"&login_hint="+hint;
    console.log("Attempting redirect at "+new Date())
    console.log(redirect)
    chrome.tabs.update(tab.id, {url: redirect})
}

updateItems();

// Storage was updated by another browser instance
chrome.storage.onChanged.addListener(changes => {
    chrome.storage.sync.get(updateItems)
})

// Storage was updated by user action on the active tab
chrome.runtime.onMessage.addListener((request, sender) => {
    chrome.storage.sync.set({[autoHost(sender.tab.url)]: request.hint})
    redirect(sender.tab, request.hint)
})

chrome.webNavigation.onCompleted.addListener(details => {
    if (details.frameId === 0) {
        chrome.tabs.get(details.tabId, tab => {
            let url = tab.url
            let host = autoHost(url)
            if (url.indexOf("login_hint") < 0 && autoLogins[host]) {
                redirect(tab, autoLogins[host])
            } else {
                chrome.tabs.insertCSS({file: 'styles/oauth.css'})
                chrome.tabs.executeScript( {file: 'src/script.js'})
            }
        })
    }
}, {url: [
        {hostEquals: 'accounts.google.com'},
        {pathPrefix: 'o/oauth2/auth/oauthchooseaccount'}]
})