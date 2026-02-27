importScripts('pako.js')

chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'})

chrome.action.disable()

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
    let match = xml.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/)
    if (!match) return null
    return new URL(match[1]).host
}

function redirect(tab, hint) {
    let url = tab.url
    let dest

    if (url.indexOf('/v3/signin/') > 0) {
        // v3 accountchooser ignores login_hint, so redirect via the classic OAuth endpoint
        let params = new URLSearchParams(new URL(url).search)
        let oauthParams = new URLSearchParams()
        for (let key of ['client_id', 'redirect_uri', 'response_type', 'scope', 'state']) {
            if (params.has(key)) oauthParams.set(key, params.get(key))
        }
        oauthParams.set('login_hint', hint)
        dest = 'https://accounts.google.com/o/oauth2/auth?' + oauthParams.toString()
    } else {
        dest = url.replace(/prompt=[^&]+/, '') + "&login_hint=" + hint
    }

    console.log("Attempting redirect at "+new Date())
    console.log(dest)
    chrome.tabs.update(tab.id, {url: dest})
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({id: 'auto-oauth', title: "Auto OAuth..."})
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['src/show_menu.js']})
})

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.addAuto) {
        chrome.storage.sync.set({[request.host]: request.addAuto})
        redirect(request.tab, request.addAuto)
    }
})

chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return

    let tab = await chrome.tabs.get(details.tabId)
    let url = decodeURI(tab.url)

    let host = null
    if (url.indexOf("redirect_uri") > 0) {
        host = autoHost(url)
    } else if (url.indexOf("SAMLRequest") > 0) {
        host = hostFromSaml(url)
    }

    if (host) {
        chrome.action.enable(details.tabId)
        await chrome.storage.session.set({[String(tab.id)]: host})

        let items = await chrome.storage.sync.get(host)
        if (url.indexOf("login_hint") < 0 && items[host]) {
            await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['src/redirecting.js']})
            redirect(tab, items[host])
        }

        if (url.indexOf("domain_hint") > 0) {
            await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['src/prefill.js']})
        }
    }
}, {url: [
        {urlPrefix: 'https://accounts.google.com/o/oauth2/'},
        {urlPrefix: 'https://accounts.google.com/v3/signin/'},
        {urlPrefix: 'https://login.microsoftonline.com/'},
    ]
})