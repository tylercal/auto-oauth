(function() {

    let options = []

    // microsoft
    document.querySelectorAll('.table[data-test-id]').forEach(value => {
        options.push(value.dataset.testId)
    })

    // google
    document.querySelectorAll('div[data-email]').forEach(value => {
        options.push(value.dataset.email)
    })

    chrome.runtime.sendMessage({options: options})
})();