/**
 * Offer letter notification email template
 */

interface OfferLetterNotificationData {
  candidateName: string;
  position: string;
  companyName: string;
  joiningDate: Date;
  acceptUrl: string;
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

export function offerLetterNotification(data: OfferLetterNotificationData): EmailTemplate {
  const { candidateName, position, companyName, joiningDate, acceptUrl } = data;

  const joiningDateFormatted = `${MONTH_NAMES[joiningDate.getMonth()]} ${joiningDate.getDate()}, ${joiningDate.getFullYear()}`;

  const subject = `Offer Letter from ${companyName}`;

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
    <h1 style="color: #2563eb; margin-top: 0; font-size: 24px;">${companyName}</h1>
    <h2 style="color: #1e293b; margin-top: 20px; font-size: 20px;">Congratulations on Your Offer!</h2>
  </div>

  <div style="padding: 20px 0;">
    <p style="margin-bottom: 16px;">Dear ${candidateName},</p>

    <p style="margin-bottom: 16px;">
      We are delighted to extend an offer for the position of <strong>${position}</strong> at ${companyName}.
    </p>

    <p style="margin-bottom: 16px;">
      Your tentative joining date is <strong>${joiningDateFormatted}</strong>.
    </p>

    <p style="margin-bottom: 16px;">
      Please review and accept this offer by clicking the button below:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${acceptUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Offer
      </a>
    </div>

    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px; word-break: break-all;">
      ${acceptUrl}
    </p>

    <p style="margin-top: 30px; margin-bottom: 16px;">
      We look forward to welcoming you to our team!
    </p>

    <p style="margin-bottom: 16px;">
      Best regards,<br>
      <strong>HR Team</strong><br>
      ${companyName}
    </p>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; color: #64748b; font-size: 12px;">
    <p style="margin-bottom: 8px;">
      This is an automated message. Please do not reply to this email.
    </p>
    <p style="margin: 0;">
      If you have any questions, please contact our HR department.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
${companyName} - Offer Letter

Dear ${candidateName},

We are delighted to extend an offer for the position of ${position} at ${companyName}.

Your tentative joining date is ${joiningDateFormatted}.

Please review and accept this offer by visiting: ${acceptUrl}

We look forward to welcoming you to our team!

Best regards,
HR Team
${companyName}

This is an automated message. Please do not reply to this email.
If you have any questions, please contact our HR department.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}
