let autoLogins = {}

function autoHost(url) {
    console.log("Finding redirect for: "+url)
    return new URL((new URLSearchParams(new URL(url).search)).get('redirect_uri')).host
}

function updateItems() {
    chrome.storage.sync.get(items => {
        autoLogins = items
    })
}

updateItems();

function redirect(tab, hint) {
    let redirect = tab.url+"&login_hint="+hint;
    console.log("Attempting redirect at "+new Date())
    console.log(redirect)
    chrome.tabs.update(tab.id, {url: redirect})
}

// Storage was updated by another browser instance
chrome.storage.onChanged.addListener(changes => {
    chrome.storage.sync.get(updateItems)
})

// Storage was updated by user action on the active tab
chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.addAuto) {
        chrome.storage.sync.set({[request.host]: request.addAuto})
        redirect(request.tab, request.addAuto)
    }
})

chrome.webNavigation.onCompleted.addListener(details => {
    if (details.frameId === 0) {
        chrome.tabs.get(details.tabId, tab => {
            let url = tab.url
            if (url.indexOf("redirect_uri") > 0) {
                chrome.pageAction.show(details.tabId)
                let host = autoHost(url)
                if (url.indexOf("login_hint") < 0 && autoLogins[host]) {
                    redirect(tab, autoLogins[host])
                }
            }
        })
    }
}, {url: [
        {urlPrefix: 'https://accounts.google.com/o/oauth2/auth/oauthchooseaccount'},
        {urlPrefix: 'https://login.microsoftonline.com/common/oauth2/'},
    ]
})