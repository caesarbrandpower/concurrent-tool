'use server';

import nodemailer from 'nodemailer';
import { AnalysisResult } from '@/types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.mijndomein.nl',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'hello@newfound.agency',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendAnalysisEmail(
  to: string,
  url: string,
  result: AnalysisResult
): Promise<void> {
  const htmlContent = `
    <h1>Jouw Concurrent Analyse</h1>
    <p>Bedankt voor je interesse in onze analyse voor <strong>${url}</strong>.</p>

    <h2>Samenvatting</h2>
    <p>${result.samenvatting}</p>

    <h2>Wat jou echt anders maakt</h2>
    <ul>
      ${result.onderscheid.map(item => `<li>${item}</li>`).join('')}
    </ul>

    <h2>De implicatie</h2>
    <p><em>${result.implicatie}</em></p>

    <hr>
    <p>Samen scherper naar je merk kijken? <a href="mailto:hello@newfound.agency">Mail ons</a></p>
    <p><small>Een tool van <a href="https://newfound.agency">Newfound Agency</a></small></p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'hello@newfound.agency',
      to,
      subject: `Jouw concurrent analyse voor ${url}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
}
