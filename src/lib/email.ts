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
  const competitorHtml = result.concurrenten && result.concurrenten.length > 0
    ? `<h2>Jouw concurrenten</h2>
       <ul>
         ${result.concurrenten.map(c => `<li><strong>${c.naam}</strong> (${c.url}): ${c.omschrijving}</li>`).join('')}
       </ul>`
    : '';

  const htmlContent = `
    <h1>Jouw Marktscan</h1>
    <p>Bedankt voor je interesse in onze analyse voor <strong>${url}</strong>.</p>

    <h2>Conclusie</h2>
    <p><strong>${result.conclusie}</strong></p>

    ${competitorHtml}

    <h2>${result.inzicht1.titel}</h2>
    <p>${result.inzicht1.tekst}</p>
    <p><em>Actie: ${result.inzicht1.actie}</em></p>

    <h2>${result.inzicht2.titel}</h2>
    <p>${result.inzicht2.tekst}</p>
    <p><em>Actie: ${result.inzicht2.actie}</em></p>

    <h2>${result.inzicht3.titel}</h2>
    <p>${result.inzicht3.tekst}</p>
    <p><em>Actie: ${result.inzicht3.actie}</em></p>

    <hr>
    <p>Samen scherper naar je merk kijken? <a href="mailto:hello@newfound.agency">Mail ons</a></p>
    <p><small>Een tool van <a href="https://newfound.agency">Newfound Agency</a></small></p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'hello@newfound.agency',
      to,
      subject: `Jouw marktscan voor ${url}`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
}
