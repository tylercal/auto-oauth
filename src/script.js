(function() {

    function parseHost(search) {
        let redirectUri = (new URLSearchParams(search)).get('redirect_uri');
        redirectUri = redirectUri.replace('storagerelay://https/', 'https://')
        return new URL(redirectUri).host
    }

    let options = []
    let host = parseHost(window.location.search)

    // microsoft
    document.querySelectorAll('.table[data-test-id]').forEach(value => {
        options.push(value.dataset.testId)
    })

    // google
    document.querySelectorAll('div[data-email]').forEach(value => {
        options.push(value.dataset.email)
    })

    chrome.runtime.sendMessage({options: options, host: host})
})();