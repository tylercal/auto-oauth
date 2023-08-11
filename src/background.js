let autoLogins = {}
let hostMap = {}

function paramValue(url, key) {
    return (new URLSearchParams(new URL(url).search)).get(key)
}

function autoHost(url) {
    console.log("Finding redirect for: "+url)
    return new URL(
        paramValue(url, 'redirect_uri')
        .replace('storagerelay://https', 'https:/') // need to remove non URL protocol
    ).host
}

function hostFromSaml(url) {
    console.log("Finding redirect for SAML: "+url)
    let component = decodeURIComponent(paramValue(url, 'SAMLRequest'))
    let charData = pako.inflateRaw(new Uint8Array(atob(component).split('').map(function(x){return x.charCodeAt(0);})))
    let xml = String.fromCharCode.apply(null, new Uint16Array(charData))
    let document = (new DOMParser()).parseFromString(xml, "text/xml");
    return new URL(document.getElementsByTagName("saml:Issuer")[0].firstChild.nodeValue).host
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.tabs.executeScript(tab.id, {file: 'src/show_menu.js'})
})

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.addAuto) { // Storage was updated by user action on the active tab
        chrome.storage.sync.set({[request.host]: request.addAuto})
        redirect(request.tab, request.addAuto)
    } else if (request.hostForTabId) { // A request was made to know the parsed host for a tab's URL
        chrome.runtime.sendMessage({requestedHost: {tabId: request.hostForTabId, host: hostMap[request.hostForTabId]}})
    }
})

chrome.webNavigation.onCompleted.addListener(details => {
    if (details.frameId === 0) {
        chrome.tabs.get(details.tabId, tab => {
            let url = decodeURI(tab.url)

            let host = null
            if (url.indexOf("redirect_uri") > 0) {
                host = autoHost(url)
            } else if (url.indexOf("SAMLRequest")) {
                host = hostFromSaml(url)
            }

            if (host) {
                chrome.pageAction.show(details.tabId)
                chrome.contextMenus.create({id: 'auto-oauth',title: "Auto OAuth..."})
                hostMap[tab.id] = host
                if (url.indexOf("login_hint") < 0 && autoLogins[host]) {
                    chrome.tabs.executeScript(tab.id, {file: 'src/redirecting.js'})
                    redirect(tab, autoLogins[host])
                }

                if (url.indexOf("domain_hint") > 0) {
                    chrome.tabs.executeScript(tab.id, {file: 'src/prefill.js'})
                }
            }
        })
    }
}, {url: [
        {urlPrefix: 'https://accounts.google.com/o/oauth2/'},
        {urlPrefix: 'https://login.microsoftonline.com/'},
    ]
})