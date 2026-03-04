/**
 * Announcement notification email template
 * Sent to all employees when a new org-wide announcement is posted
 */

interface AnnouncementNotificationData {
  employeeName: string;
  title: string;
  content: string;
  postedBy: string;
  dashboardUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function announcementNotificationTemplate(
  data: AnnouncementNotificationData
): EmailTemplate {
  const { employeeName, title, content, postedBy, dashboardUrl } = data;

  const subject = `[ShreeHR] ${title}`;

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
    <h2 style="color: #1e293b; margin-top: 20px; font-size: 20px;">New Announcement</h2>
  </div>

  <div style="padding: 20px 0;">
    <p style="margin-bottom: 16px;">Hello ${employeeName},</p>

    <p style="margin-bottom: 16px;">
      A new announcement has been posted by <strong>${postedBy}</strong>.
    </p>

    <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; border-radius: 4px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">${title}</h3>
      <div style="color: #475569; white-space: pre-wrap;">${content}</div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        View Dashboard
      </a>
    </div>

    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px; word-break: break-all;">
      ${dashboardUrl}
    </p>
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

  const text = `Hi ${employeeName},

New Announcement: ${title}

${content}

Posted by: ${postedBy}

View on dashboard: ${dashboardUrl}

This is an automated message. Please do not reply to this email.
If you have any questions, please contact your HR department.`.trim();

  return {
    subject,
    html,
    text,
  };
}
