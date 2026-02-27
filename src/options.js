function error(message) {
    feedback("error", message)
}

function warn(message) {
    feedback("warn", message)
}

function message(message) {
    feedback("message", message)
}

function feedback(show, message) {
    ["error", "warn", "message"].forEach(value => {
        if (show !== value) document.getElementById(value).classList.add('d-none')
    })
    let box = document.getElementById(show);
    box.classList.remove('d-none')
    box.innerText = message
}

async function deleteItem(e) {
    e.preventDefault()
    console.log(this.dataset.host)
    try {
        await chrome.storage.sync.remove(this.dataset.host)
        message("Removed auto-auth for "+this.dataset.host)
    } catch (err) {
        error("Couldn't delete that rule.")
    }
    this.parentElement.parentElement.remove()
}

function hydrateForm(items) {
    let form = document.getElementById("items")
    let example = document.getElementById("example")
    Object.entries(items).forEach(value => {
        let host = value[0]
        let id = value[1]
        let row = example.cloneNode(true)
        row.classList.remove('d-none')
        row.removeAttribute('id')
        row.querySelector(".host").value = host
        row.querySelector(".id").value = id
        let deleteBtn = row.querySelector(".btn-danger");
        deleteBtn.dataset.host = host
        deleteBtn.addEventListener('click', deleteItem)
        form.prepend(row)
    })
    initExport(items)
}

async function restore_options() {
    let items = await chrome.storage.sync.get()
    hydrateForm(items)
}

function initExport(settings) {
    e = document.getElementById("export")
    e.href = 'data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(settings))
    e.download = 'auto-oauth-export.json'
}

async function importSettings() {
    const fileReader = new FileReader()
    fileReader.onload = async function (e) {
        const settings = JSON.parse(e.target.result.toString())
        document.querySelectorAll('.form-row:not(#example)').forEach(option => option.remove())
        hydrateForm(settings)
        await chrome.storage.sync.set(settings)
        message("Import complete.")
    }
    fileReader.readAsText(this.files[0], "UTF-8")
}

document.getElementById('upload').addEventListener('change', importSettings)
document.addEventListener('DOMContentLoaded', restore_options)