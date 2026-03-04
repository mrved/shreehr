/**
 * Birthday and work anniversary digest email template
 * Sent as a daily digest listing today's birthdays and work anniversaries
 */

interface BirthdayEntry {
  name: string;
  type: 'birthday' | 'anniversary';
  years?: number; // years of service for anniversaries
}

interface BirthdayNotificationData {
  recipientName: string;
  celebrations: BirthdayEntry[];
  dashboardUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function birthdayNotificationTemplate(
  data: BirthdayNotificationData
): EmailTemplate {
  const { recipientName, celebrations, dashboardUrl } = data;

  const subject = `[ShreeHR] Today's Celebrations`;

  const celebrationLines = celebrations.map((c) => {
    if (c.type === 'birthday') return `Happy Birthday to ${c.name}!`;
    return `${c.name} — ${c.years} Year${c.years !== 1 ? 's' : ''} Work Anniversary!`;
  });

  const celebrationHtmlItems = celebrations
    .map((c) => {
      if (c.type === 'birthday') {
        return `
    <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center;">
      <span style="font-size: 24px; margin-right: 12px;">&#127874;</span>
      <div>
        <strong style="color: #1e293b;">${c.name}</strong>
        <div style="color: #64748b; font-size: 14px;">Happy Birthday!</div>
      </div>
    </li>`;
      }
      return `
    <li style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center;">
      <span style="font-size: 24px; margin-right: 12px;">&#127881;</span>
      <div>
        <strong style="color: #1e293b;">${c.name}</strong>
        <div style="color: #64748b; font-size: 14px;">${c.years} Year${c.years !== 1 ? 's' : ''} Work Anniversary!</div>
      </div>
    </li>`;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0; font-size: 24px;">ShreeHR</h1>
    <h2 style="color: #1e293b; margin-top: 20px; font-size: 20px;">Today's Celebrations</h2>
  </div>

  <div style="padding: 20px 0;">
    <p style="margin-bottom: 16px;">Hello ${recipientName},</p>

    <p style="margin-bottom: 16px;">
      Let's take a moment to celebrate our colleagues today!
    </p>

    <ul style="list-style: none; padding: 0; margin: 20px 0; border-top: 1px solid #e2e8f0;">
      ${celebrationHtmlItems}
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        View Dashboard
      </a>
    </div>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 12px;">
    <p style="margin-bottom: 8px;">
      This is an automated message. Please do not reply to this email.
    </p>
    <p style="margin: 0;">
      If you have any questions, please contact your HR department.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `Hi ${recipientName},

Today we celebrate:
${celebrationLines.join('\n')}

View on dashboard: ${dashboardUrl}

This is an automated message. Please do not reply to this email.
If you have any questions, please contact your HR department.`.trim();

  return {
    subject,
    html,
    text,
  };
}
