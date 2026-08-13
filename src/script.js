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

    // google v3 chooser, which renders each account as a list item wrapping a link
    // and carries the address as text rather than in a data attribute
    if (options.length === 0) {
        document.querySelectorAll('li').forEach(li => {
            if (!li.querySelector('a, button, [role="link"], [role="button"]')) return
            let match = (li.innerText || '').match(/[^\s@]+@[^\s@]+\.[^\s@]+/)
            if (match) options.push(match[0])
        })
    }

    chrome.runtime.sendMessage({options: [...new Set(options)]})
})();