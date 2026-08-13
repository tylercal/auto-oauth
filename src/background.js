importScripts('pako.js')

chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'})

chrome.action.disable()

function paramValue(url, key) {
    return (new URLSearchParams(new URL(url).search)).get(key)
}

function hostOf(value) {
    if (!value) return null
    try {
        return new URL(
            value.replace('storagerelay://https', 'https:/') // need to remove non URL protocol
        ).host
    } catch (e) {
        return null
    }
}

function autoHost(url) {
    console.log("Finding redirect for: "+url)
    return hostOf(paramValue(url, 'redirect_uri'))
}

// Google Identity Services popups send redirect_uri=gis_transform, a marker rather
// than a URL, so there is no host to read there. Those flows carry the site being
// logged into in origin/app_domain instead.
function hostFromOrigin(url) {
    return hostOf(paramValue(url, 'origin')) || hostOf(paramValue(url, 'app_domain'))
}

function hostFromSaml(url) {
    console.log("Finding redirect for SAML: "+url)
    try {
        let component = decodeURIComponent(paramValue(url, 'SAMLRequest'))
        let charData = pako.inflateRaw(new Uint8Array(atob(component).split('').map(function(x){return x.charCodeAt(0);})))
        let xml = String.fromCharCode.apply(null, new Uint16Array(charData))
        let match = xml.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/)
        if (!match) return null
        return hostOf(match[1])
    } catch (e) {
        console.log("Could not read SAMLRequest: "+e)
        return null
    }
}

// Runs in the page, not here: click the row for `hint` on Google's v3 chooser.
// The list renders after onCompleted fires, so keep looking for a short while.
function clickAccount(hint) {
    let wanted = hint.toLowerCase()
    let attempts = 50

    let CLICKABLE = 'a, button, [role="link"], [role="button"]'

    function clickableFor(el) {
        return el.querySelector(CLICKABLE) || el.closest(CLICKABLE)
    }

    function target() {
        let tagged = [...document.querySelectorAll('[data-email], [data-identifier]')].find(el =>
            (el.dataset.email || el.dataset.identifier || '').toLowerCase() === wanted
        )
        if (tagged) return clickableFor(tagged)

        // v3 renders each account as a list item wrapping a link; only ever click one
        // of those, so a password or challenge page showing the address is left alone
        let row = [...document.querySelectorAll('li')].find(li =>
            (li.innerText || '').toLowerCase().includes(wanted) && li.querySelector(CLICKABLE)
        )
        return row && clickableFor(row)
    }

    function attempt() {
        let found = target()
        if (found) {
            found.click()
        } else if (attempts-- > 0) {
            setTimeout(attempt, 200)
        } else {
            console.log("Auto OAuth: no account row matching " + hint)
            let spinner = document.getElementById('auto-oauth-spinner')
            if (spinner) spinner.remove()
        }
    }

    attempt()
}

async function redirect(tab, hint) {
    // The v3 chooser ignores login_hint, and a GIS popup's redirect_uri is not a real
    // URL, so there is no OAuth request to rebuild. Pick the account on the page instead.
    if (tab.url.indexOf('/v3/signin/') > 0) {
        console.log("Selecting "+hint+" on the account chooser at "+new Date())
        await chrome.scripting.executeScript({target: {tabId: tab.id}, func: clickAccount, args: [hint]})
        return
    }

    let dest = tab.url.replace(/prompt=[^&]+/, '') + "&login_hint=" + hint
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
    if (!host) host = hostFromOrigin(url)

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