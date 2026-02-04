/**
 * Payslip notification email template
 */

interface PayslipNotificationData {
  employeeName: string;
  month: number;
  year: number;
  payslipUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function payslipNotificationTemplate(data: PayslipNotificationData): EmailTemplate {
  const { employeeName, month, year, payslipUrl } = data;
  const monthName = MONTH_NAMES[month - 1];

  const subject = `Your Payslip for ${monthName} ${year} is Ready`;

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
    <h2 style="color: #1e293b; margin-top: 20px; font-size: 20px;">Your Payslip is Ready</h2>
  </div>

  <div style="padding: 20px 0;">
    <p style="margin-bottom: 16px;">Hello ${employeeName},</p>

    <p style="margin-bottom: 16px;">
      Your payslip for <strong>${monthName} ${year}</strong> has been generated and is now available for download.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${payslipUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        View Payslip
      </a>
    </div>

    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px; word-break: break-all;">
      ${payslipUrl}
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

  const text = `
ShreeHR - Your Payslip is Ready

Hello ${employeeName},

Your payslip for ${monthName} ${year} has been generated and is now available for download.

View your payslip here: ${payslipUrl}

This is an automated message. Please do not reply to this email.
If you have any questions, please contact your HR department.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
