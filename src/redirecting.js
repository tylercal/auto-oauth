(function() {
    let div = document.createElement('div')
    let title = document.createElement('h1')
    let icon = document.createElement('object')

    title.innerText = "Auto choosing..."
    icon.data = chrome.extension.getURL("images/icon.svg")
    icon.width = '64'
    icon.height = '64'

    div.prepend(icon)
    div.prepend(title)

    let rotate = 0
    setTimeout(spin, 100)

    function spin() {
        rotate = (rotate + 5)
        icon.style.transform = 'rotate(' + rotate + 'deg)'
        if (rotate < 1800) {
            let timeout = rotate % 360
            setTimeout(spin, timeout === 0 ? 1500 : timeout/15)
        }
    }

    let google = document.getElementById('headingText');
    let microsoft = document.querySelector('div[role="main"]');

    let insert = document.body
    if (google) {
        insert = google.parentNode
    } else if (microsoft) {
        insert = microsoft
    }
    insert.prepend(div)
})();