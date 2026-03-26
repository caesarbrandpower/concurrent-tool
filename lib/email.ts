import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendConfirmationEmail(to: string, url: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: to,
    bcc: process.env.SMTP_BCC,
    subject: 'Je concurrentie-analyse is klaar',
    text: `Bedankt voor je aanvraag.\n\nWe hebben je website (${url}) geanalyseerd samen met drie concurrenten. Je ontvangt binnen 24 uur een persoonlijk advies van ons team.\n\nMet vriendelijke groet,\nNewfound Agency`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <h2 style="font-size: 24px; margin-bottom: 20px; font-weight: 600;">Bedankt voor je aanvraag</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We hebben je website (${url}) geanalyseerd samen met drie concurrenten. 
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Je ontvangt binnen 24 uur een persoonlijk advies van ons team.
        </p>
        <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 40px;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            Met vriendelijke groet,<br/>
            <strong>Newfound Agency</strong>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}