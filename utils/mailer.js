import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Helper to build List-Unsubscribe header value
 */

function buildListUnsubscribeHeader({ domain, unsubscribeLink }) {
  // must be comma separated and wrapped in angle brackets
  // example: "<mailto:unsubscribe@your-domain.com>, <https://example.com/unsubscribe?token=...>"
  const parts = [];
  if (domain) parts.push(`<mailto:unsubscribe@${domain}>`);
  if (unsubscribeLink) parts.push(`<${unsubscribeLink}>`);
  return parts.join(", ");
}

/**
 * sendMail options:
 * - to, subject, html, text (existing)
 * - replyTo (optional)
 * - unsubscribeLink (optional) : full URL with token encoded
 * - attachments (optional)
 */
export async function sendMail({ to, subject, html, text, replyTo, unsubscribeLink, attachments }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const domain = (from || "").split("@")[1] || null;

  const listUnsubscribeHeader = buildListUnsubscribeHeader({ domain, unsubscribeLink });

  const mailOptions = {
    from,
    to,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]+>/g, "") : ""),
    replyTo: replyTo || process.env.SUPPORT_EMAIL || from,
    headers: {},
    attachments,
  };


  if (listUnsubscribeHeader) mailOptions.headers["List-Unsubscribe"] = listUnsubscribeHeader;

  return transporter.sendMail(mailOptions);
}

export default transporter;
