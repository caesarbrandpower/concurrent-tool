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
    ? `<h2 style="font-size:20px;color:#fff;margin:32px 0 16px;">Jouw concurrenten</h2>
       ${result.concurrenten.map(c => `
         <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:16px 20px;margin-bottom:10px;">
           <p style="margin:0 0 4px;font-weight:600;color:#fff;">${c.naam} <a href="${c.url}" style="font-weight:400;color:rgba(255,255,255,0.4);font-size:13px;text-decoration:none;">${c.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></p>
           <p style="margin:0 0 6px;color:rgba(255,255,255,0.7);font-size:15px;">${c.omschrijving}</p>
           <p style="margin:0;color:#9b6fd4;font-size:14px;font-style:italic;">${c.reden}</p>
         </div>
       `).join('')}`
    : '';

  const actieplanHtml = result.actieplan && result.actieplan.length > 0
    ? `<h2 style="font-size:20px;color:#fff;margin:32px 0 16px;">Jouw actieplan</h2>
       <ol style="padding-left:20px;margin:0;">
         ${result.actieplan.map((stap) => `<li style="color:rgba(255,255,255,0.8);font-size:15px;margin-bottom:10px;line-height:1.6;">${stap}</li>`).join('')}
       </ol>`
    : '';

  const htmlContent = `
    <div style="background:#1a1a1a;padding:40px 24px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;">
        <h1 style="font-size:32px;color:#fff;margin:0 0 8px;text-transform:uppercase;">${result.merknaam || url}</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 32px;">Marktscan voor ${url}</p>

        <h2 style="font-size:20px;color:#fff;margin:0 0 12px;">Conclusie</h2>
        <p style="font-size:24px;font-weight:700;color:#fff;margin:0 0 32px;line-height:1.3;">${result.conclusie}</p>

        ${competitorHtml}

        <h2 style="font-size:20px;color:#fff;margin:32px 0 16px;">${result.inzicht1.titel}</h2>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.6;margin:0 0 8px;">${result.inzicht1.tekst}</p>
        <p style="color:#9b6fd4;font-size:14px;font-style:italic;margin:0 0 24px;">Actie: ${result.inzicht1.actie}</p>

        <h2 style="font-size:20px;color:#fff;margin:32px 0 16px;">${result.inzicht2.titel}</h2>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.6;margin:0 0 8px;">${result.inzicht2.tekst}</p>
        <p style="color:#9b6fd4;font-size:14px;font-style:italic;margin:0 0 24px;">Actie: ${result.inzicht2.actie}</p>

        <h2 style="font-size:20px;color:#fff;margin:32px 0 16px;">${result.inzicht3.titel}</h2>
        <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.6;margin:0 0 8px;">${result.inzicht3.tekst}</p>
        <p style="color:#9b6fd4;font-size:14px;font-style:italic;margin:0 0 24px;">Actie: ${result.inzicht3.actie}</p>

        ${actieplanHtml}

        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:40px 0;">
        <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0 0 16px;">Klaar voor de volgende stap? <a href="mailto:hello@newfound.agency" style="color:#1a73e8;text-decoration:underline;font-weight:600;">Plan een kennismaking</a></p>
        <div style="margin-top:16px;"><span style="font-size:13px;color:#666666;letter-spacing:2px;text-transform:uppercase;">Een tool van</span><span style="font-size:13px;color:#999999;letter-spacing:2px;text-transform:uppercase;margin-left:6px;font-weight:600;">Newfound</span></div>
      </div>
    </div>
  `;

  try {
    const sendPromise = transporter.sendMail({
      from: process.env.SMTP_USER || 'hello@newfound.agency',
      to,
      bcc: 'hello@newfound.agency',
      subject: `Jouw marktscan voor ${result.merknaam || url}`,
      html: htmlContent,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout na 10s')), 10000)
    );
    await Promise.race([sendPromise, timeoutPromise]);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
}
