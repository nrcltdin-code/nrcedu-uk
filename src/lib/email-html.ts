// Branded HTML version of a plain-text email. Every character of the text is escaped, so
// nothing typed by a visitor can become markup; web addresses become links that show the
// exact address they open, so a link can never be disguised.

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const linkStyle = "color:#174c80;text-decoration:underline;word-break:break-all;";

function linkify(escaped: string) {
  return escaped.replace(/https:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g, (url) => `<a href="${url}" style="${linkStyle}">${url}</a>`);
}

export function emailHtml({ subject, text, siteUrl }: { subject: string; text: string; siteUrl: string }) {
  const paragraphs = text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;">${linkify(escape(block)).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const year = new Date().getFullYear();
  const site = escape(siteUrl.replace(/^https?:\/\//, ""));

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:#174c80;padding:20px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px;"><img src="${escape(siteUrl)}/nrc-logo.jpeg" width="44" height="44" alt="NRC" style="display:block;border-radius:50%;background:#fff;"></td>
<td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:18px;font-weight:bold;line-height:1.2;">NRC Educational<br>Consultant</td>
</tr></table>
</td></tr>
<tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;">${paragraphs}</td></tr>
<tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#64748b;text-align:center;">
NRC Educational Consultant · <a href="${escape(siteUrl)}" style="color:#64748b;">${site}</a><br>© ${year} NRC Educational Consultant
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
