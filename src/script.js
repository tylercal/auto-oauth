(function() {

    function parseHost(url) {
        return new URL((new URLSearchParams(url)).get('redirect_uri')).host
    }

    let options = []
    let host = parseHost(window.location.search)
    document.querySelectorAll('.table[data-test-id]').forEach(value => {
        options.push(value.dataset.testId)
    })

    document.querySelectorAll('#profileIdentifier').forEach(value => {
        options.push(value.dataset.email)
    })

    chrome.runtime.sendMessage({options: options, host: host})
})();