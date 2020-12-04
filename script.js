/* global console, chrome */

(function() {

    function auto() {
        let host = new URL((new URLSearchParams(window.location.search)).get('redirect_uri')).host
        chrome.storage.sync.set({[host]: this.dataset.hint})
    }


    document.querySelectorAll('#profileIdentifier').forEach(value => {
        let parent = value.offsetParent

        let autoDiv = document.createElement("div")
        autoDiv.classList.add('auto-oauth-box')
        autoDiv.dataset.hint = value.dataset.email

        let autoButton = document.createElement("img")
        autoButton.src = chrome.runtime.getURL('images/robot.png')

        let spacer = document.createElement("span");
        spacer.classList.add('auto-oauth-spacer')

        autoDiv.append(spacer)
        autoDiv.append(autoButton)
        parent.prepend(autoDiv)

        autoDiv.addEventListener('click', auto)
    })
})();