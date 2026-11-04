// Dependency-free: operations alerts must also render outside the website runtime.
export function renderOperationsEmail(message) {
  const escaped = String(message).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Anshkosh operations alert</title></head>
<body style="margin:0;padding:24px 12px;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#111827">
<div style="display:none;max-height:0;overflow:hidden">Anshkosh server health and service updates.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto"><tr><td bgcolor="#ffffff" style="padding:0;background-color:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:12px 12px 0 0">
<a href="https://www.anshkosh.com" style="display:block;line-height:0"><img src="https://www.anshkosh.com/email-header.png" width="600" height="100" alt="Anshkosh" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:11px 11px 0 0"></a>
</td></tr><tr><td style="padding:28px 24px;background-color:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
<p style="color:#a23510;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.5px;margin:0 0 8px">OPERATIONS</p><h1 style="font-size:27px;line-height:35px;letter-spacing:-0.6px;margin:0 0 20px">Operations alert.</h1>
<p style="color:#374151;font-size:15px;line-height:25px;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 16px">${escaped}</p>
<p style="color:#374151;font-size:14px;line-height:26px;margin:24px 0 0">The Anshkosh team</p></td></tr>
<tr><td style="padding:20px 12px;text-align:center;color:#6b7280;font-size:12px;line-height:19px"><p style="margin:6px 0">You received this because you are the configured Anshkosh operations contact.</p><p style="margin:6px 0"><a href="https://www.anshkosh.com" style="color:#4b5563">Anshkosh</a> · <a href="mailto:hello@anshkosh.com" style="color:#4b5563">Get help</a> · <a href="https://www.anshkosh.com/privacy" style="color:#4b5563">Privacy</a></p><p style="margin:6px 0">Anshkosh Pvt Ltd · Hyderabad, Telangana, India</p></td></tr></table></body></html>`;
}
