function error(message) {
    feedback("error", "message", message)
}

function message(message) {
    feedback("message", "error", message)
}

function feedback(show, hide, message) {
    document.getElementById(hide).classList.add('d-none')
    let box = document.getElementById("show");
    box.classList.remove('d-none')
    box.innerText = message
}

function deleteItem(e) {
    console.log(this.dataset.host)
    chrome.storage.sync.remove(this.dataset.host, () => {
        if (chrome.runtime.lastError) {
            error("Couldn't delete that rule.")
        } else {
            message("Removed auto-auth for "+this.dataset.host)
        }
    })
    this.parentElement.parentElement.remove()
    e.preventDefault()
}

function restore_options() {
    chrome.storage.sync.get(function(items) {
        let form = document.getElementById("items")
        let example = document.getElementById("example")
        Object.entries(items).forEach(value => {
            let host = value[0]
            let id = value[1]
            row = example.cloneNode(true)
            row.classList.remove('d-none')
            row.querySelector(".host").value = host
            row.querySelector(".id").value = id
            let deleteBtn = row.querySelector(".btn-danger");
            deleteBtn.dataset.host = host
            deleteBtn.addEventListener('click', deleteItem)
            form.prepend(row)
        })
    });
}
document.addEventListener('DOMContentLoaded', restore_options);