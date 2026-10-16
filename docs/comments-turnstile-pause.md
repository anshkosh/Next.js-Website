# Temporary comment CAPTCHA pause

Set `COMMENTS_TURNSTILE_ENABLED=false` in the production shared environment to hide Turnstile on startup comment forms and allow tokenless comment submissions. This is an explicit, server-controlled exception requested by the owner on 16 October 2026 while the widget's hostname configuration is being resolved.

The default is enabled. To re-enable CAPTCHA after confirming the correct widget keys and allowed hostnames, set `COMMENTS_TURNSTILE_ENABLED=true` in the shared environment and explicitly pass `COMMENTS_TURNSTILE_ENABLED=true` when restarting the active web process with PM2's `--update-env` option. Removing the shared setting alone is insufficient if PM2 still retains `false` in its saved process environment. Read the active web process name from `/var/www/anshkosh-shared/state/current.json` before restarting. Startup pages render dynamically, so a new request picks up the server setting after the process reload.

The contact form retains its existing Turnstile verification. Comment field validation, live-startup checks, three-comments-per-hour rate limit and mandatory `PENDING` moderation remain active during the pause. A client-supplied field cannot disable server-side verification.

The new Cloudflare widget named `Anshkosh production forms` exists in the `anshkosh@gmail.com` account with hostname `anshkosh.com`, Managed mode and no pre-clearance. Its keys have not replaced the website's existing keys as part of this pause. Secrets remain outside the repository.
