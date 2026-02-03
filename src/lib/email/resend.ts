import { Resend } from 'resend';

/**
 * Resend email service
 * Sends transactional emails using Resend API
 */

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  messageId: string;
}

/**
 * Send an email using Resend
 *
 * @param params Email parameters
 * @returns Result with messageId on success
 * @throws Error with descriptive message on failure
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text } = params;

  const from = process.env.EMAIL_FROM || 'noreply@shreehr.local';

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    if (!result.data?.id) {
      throw new Error('Resend API returned no message ID');
    }

    return {
      messageId: result.data.id,
    };
  } catch (error: any) {
    // Re-throw with descriptive message
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
