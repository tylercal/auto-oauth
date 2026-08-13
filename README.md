# auto-oauth
Automatically select and login to site using your preferred Google or Microsoft identity.

## Overview
When you have multiple Google or Microsoft accounts (for work, home, etc) every time you try 
to log into a website via OAuth, like with the "Login with Google" button, you have to choose
the account you want to use.

This extension allows you to choose a selected account per site that you'll always want to use
in the future – one fewer click!

Release Notes:
* 1.2.1 – Fix Google Identity Services popups offering no accounts to choose from; select the account by clicking it on Google's v3 chooser
* 1.2.0 – Migrate to Manifest V3; add support for Google's new v3 signin flow; fix SAML detection bug
* 1.1.1 – Fix a bug that did not handle encoded redirect URLs
* 1.1.0 – Handle Auth in popup windows via a new context menu option
* 1.0.7 – Add detection for SAML based logins
* 1.0.6 – Help account choosing in Microsoft OAuth by pre-filling domains when available
* 1.0.5 – Handle new Google OAuth choice format
* 1.0.4 – Handle additional Google OAuth URL suffixes
* 1.0.3 – Import/Export settings
* 1.0.2 – Fix a bug preventing Google URLs from being parsed correctly
* 1.0.1 – Add support for Microsoft OAuth
* 1.0.0 – Initial release