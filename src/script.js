(function() {

    function auto() {
        document.querySelectorAll('.auto-oauth-box').forEach(box => box.remove())
        chrome.runtime.sendMessage({hint: this.dataset.hint})
    }


    document.querySelectorAll('#profileIdentifier').forEach(value => {
        let parent = value.offsetParent

        let autoDiv = document.createElement("div")
        autoDiv.classList.add('auto-oauth-box')
        autoDiv.dataset.hint = value.dataset.email

        let autoButton = document.createElement("img")
        autoButton.src = chrome.runtime.getURL('images/icon.svg')
        autoButton.width = 32

        let spacer = document.createElement("span");
        spacer.classList.add('auto-oauth-spacer')

        autoDiv.append(spacer)
        autoDiv.append(autoButton)
        parent.prepend(autoDiv)

        autoDiv.addEventListener('click', auto)
    })
})();