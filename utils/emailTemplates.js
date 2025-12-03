export function buildSubscriptionEmail({ email, unsubscribeLink }) {
  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color:#1f2937; margin:0; padding:0; background:#f9fafb;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb; padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <tr>
               <td style="background:linear-gradient(90deg, rgba(36,43,61,1) 0%, rgba(10,14,29,1) 48%); padding:32px 24px; text-align:center;">
                <h1 style="margin:0; font-size:24px; color:#ffffff; font-weight:600; letter-spacing:-0.5px;">
                  Welcome to ADL Business Solutions
                </h1>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td style="padding:40px 32px;">
                
                <!-- Success Icon -->
                <div style="text-align:center; margin-bottom:24px;">
                  <div style="display:inline-block; width:64px; height:64px; background:#10b981; border-radius:50%;">
                    <span style="color:#ffffff; font-size:32px; line-height:64px;">✓</span>
                  </div>
                </div>

                <h2 style="margin:0 0 16px 0; font-size:20px; color:#111827; text-align:center; font-weight:600;">
                  You're All Set!
                </h2>

                <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#4b5563;">
                  Thank you for subscribing to our newsletter! We're excited to have you as part of our community. 
                  At ADL Business Solutions, we're committed to helping businesses grow through innovative solutions 
                  and expert guidance.
                </p>

                <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#4b5563;">
                  As a valued subscriber, you'll stay informed about the latest developments in our industry, 
                  gain access to exclusive resources, and be the first to know about new opportunities that 
                  can benefit your business. Here's what you can expect from us:
                </p>

                <!-- Benefits List -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="padding:10px 0;">
                      <span style="color:#10b981; font-size:18px; margin-right:8px;">✓</span>
                      <span style="color:#374151; font-size:15px;">Latest packages updates and features</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;">
                      <span style="color:#10b981; font-size:18px; margin-right:8px;">✓</span>
                      <span style="color:#374151; font-size:15px;">Exclusive tips and industry insights</span>
                    </td>
                  </tr>
    
                </table>

                <p style="margin:24px 0 0 0; font-size:14px; line-height:1.5; color:#6b7280; text-align:center;">
                  We value your privacy and promise to only send valuable content. No spam, ever.
                </p>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb; padding:24px 32px; border-top:1px solid #e5e7eb;">
                
                <h4 style="margin:0 0 16px 0; font-size:13px; color:#6b7280; text-align:center;">
                  Not interested anymore? You can 
                  <a href="${unsubscribeLink}" style="color:#0b63b7; text-decoration:none; font-weight:500;">unsubscribe</a> 
                  at any time.
                </h4>

                <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
                  © ${new Date().getFullYear()} ADL Business Solutions. All rights reserved.
                </p>

              </td>
            </tr>

          </table>

          <!-- Footer Note -->
          <p style="margin:20px 0 0 0; font-size:12px; color:#9ca3af; text-align:center;">
            This email was sent to ${email} because you subscribed on ADL Business Solutions Website.
          </p>

        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const text = `Welcome to ADL Business Solutions!

Thank you for subscribing to our newsletter.

You'll now receive:
• Latest product updates and features
• Exclusive tips and industry insights
• Special offers and early access

We value your privacy and promise to only send valuable content.

Unsubscribe: ${unsubscribeLink}

© ${new Date().getFullYear()} ADL Business Solutions
This email was sent to ${email}`;

  return { html, text };
}

export function buildUnsubscribeEmail({ email }) {
  const html = `
  <!doctype html>
  <html>
  <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#333; padding:24px;">
    <div style="max-width:600px; margin:0 auto; border:1px solid #e9ecef; border-radius:8px; overflow:hidden;">
      <div style="background:#f8fafc; padding:16px 24px;">
        <h2 style="margin:0; font-size:18px;">You have been unsubscribed</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin:0 0 12px 0;">Hi,</p>
        <p style="margin:0 0 12px 0;">We confirm that <strong>${email}</strong> has been removed from our newsletter list. You will not receive further marketing emails from us.</p>
        <p style="margin:0 0 12px 0;">If this was a mistake and you’d like to re-subscribe, please visit our website or subscribe again using the form.</p>
        <p style="margin-top:18px; color:#6b7280; font-size:13px;">— Your Company</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const text = `Hello,

Your email (${email}) has been unsubscribed from our newsletter list. You will not receive further marketing emails from us.

If this was a mistake you can re-subscribe on our website.

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb; padding:24px 32px; border-top:1px solid #e5e7eb;">
                
                <h4 style="margin:0 0 16px 0; font-size:13px; color:#6b7280; text-align:center;">
                  Not interested anymore? You can 
                  <a href="${unsubscribeLink}" style="color:#0b63b7; text-decoration:none; font-weight:500;">unsubscribe</a> 
                  at any time.
                </h4>

                <p style="margin:0; font-size:12px; color:#9ca3af; text-align:center;">
                  © ${new Date().getFullYear()} ADL Business Solutions. All rights reserved.
                </p>

              </td>
            </tr>`;

  return { html, text };
}
