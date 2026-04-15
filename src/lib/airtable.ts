'use server';

import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY || '',
}).base(process.env.AIRTABLE_BASE_ID || 'appQ8PADMp8Sc7mXT');

export async function saveLead(email: string, url: string): Promise<void> {
  try {
    await base('Concurrent Leads').create([
      {
        fields: {
          Email: email,
          URL: url,
          Datum: new Date().toISOString(),
        },
      },
    ]);
  } catch (error) {
    console.error('Airtable save error:', error);
    throw new Error('Failed to save lead');
  }
}
