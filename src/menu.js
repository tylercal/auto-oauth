(function() {

    let example = document.getElementById("example")
    let choiceList = document.getElementById("choices")
    let host = ''

    function addAuto() {
        document.getElementById('done').classList.remove('d-none')
        document.querySelectorAll('button').forEach(btn => {
            btn.classList.add('d-none')
        })
        chrome.runtime.sendMessage({addAuto: this.innerText, host: host})
        // setTimeout(()=>{window.close()}, 1500)
    }

    chrome.runtime.onMessage.addListener(
        function(request, sender) {
            if (request.options) {
                host = request.host
                document.getElementById('host').innerText = host
                request.options.forEach((option) => {
                    let button = example.cloneNode(true)
                    button.classList.remove('d-none')
                    button.id = ''
                    button.innerText = option
                    button.addEventListener('click', addAuto)
                    choiceList.append(button)
                })
            }
        });

    chrome.tabs.executeScript({file: 'src/script.js'})
})();