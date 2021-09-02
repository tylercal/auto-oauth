(function() {
    let login_field = document.querySelector('input[name="loginfmt"]');
    var domain_hint = /domain_hint=([^&]+)/.exec(document.URL)[1];
    if (login_field && domain_hint){
        // Check domain hint is actually a domain
        var is_domain = /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/.exec(domain_hint)
        if (is_domain) {
            login_field.value = "@" + domain_hint;
        }
    }
})();