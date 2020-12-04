/* global console, chrome */

let autoLogins = {}

function updateItems() {
    chrome.storage.sync.get(items => {
        autoLogins = items
    })
}

updateItems();

chrome.storage.onChanged.addListener(changes => {
    chrome.storage.sync.get(updateItems)
})

chrome.webNavigation.onCompleted.addListener(details => {
    chrome.tabs.get(details.tabId, tab => {
        let url = tab.url
        let host = new URL((new URLSearchParams(url)).get('redirect_uri')).host
        if (url.indexOf("login_hint") < 0 && autoLogins[host]) {
            chrome.tabs.update(tab.id, {url: url+"&login_hint="+autoLogins[host]})
        } else {
            chrome.tabs.insertCSS({file: 'oauth.css'})
            chrome.tabs.executeScript( {
                file: 'script.js'})
        }
    })
}, {url: [
        {hostEquals: 'accounts.google.com'},
        {pathPrefix: 'o/oauth2/auth/oauthchooseaccount'}]
})