(function() {
    let options = []
    let host = new URL((new URLSearchParams(window.location.href)).get('redirect_uri')).host
    document.querySelectorAll('.table[data-test-id]').forEach(value => {
        options.push(value.dataset.testId)
    })

    document.querySelectorAll('#profileIdentifier').forEach(value => {
        options.push(value.dataset.email)
    })

    chrome.runtime.sendMessage({options: options, host: host})
})();