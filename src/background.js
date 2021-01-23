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
    let redirect = tab.url.replace(/prompt=[^&]+/, '')+"&login_hint="+hint;
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

https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=54a2777d-3c3b-40b3-8239-67bdfd8d0e44&domain_hint=linkedin.biz&redirect_uri=https%3A%2F%2Fo365.roomj.com%2Fauth%2Fmicrosoft_graph%2Fcallback&response_type=code&scope=openid+email+profile+offline_access+https%3A%2F%2Fgraph.microsoft.com%2FUser.Read+https%3A%2F%2Fgraph.microsoft.com%2FCalendars.ReadWrite&state=40a28760518d9976b5a0f0520bc456ec9f3d9c6ccf9e4752

chrome.webNavigation.onCompleted.addListener(details => {
    if (details.frameId === 0) {
        chrome.tabs.get(details.tabId, tab => {
            let url = tab.url
            if (url.indexOf("redirect_uri") > 0) {
                chrome.pageAction.show(details.tabId)
                let host = autoHost(url)
                if (url.indexOf("login_hint") < 0 && autoLogins[host]) {
                    chrome.tabs.executeScript(tab.id, {file: 'src/redirecting.js'})
                    redirect(tab, autoLogins[host])
                }
            }
        })
    }
}, {url: [
        {urlPrefix: 'https://accounts.google.com/o/oauth2/auth/oauthchooseaccount'},
        {urlPrefix: 'https://login.microsoftonline.com/'},
    ]
})