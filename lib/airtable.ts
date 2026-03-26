import Airtable from 'airtable';
import { LeadData } from '@/types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

const TABLE_NAME = 'Concurrent Leads';

export async function saveLead(data: LeadData): Promise<void> {
  await base(TABLE_NAME).create([
    {
      fields: {
        Email: data.email,
        URL: data.url,
        Timestamp: data.timestamp,
        Analysis: data.analysis ? JSON.stringify(data.analysis) : undefined,
      },
    },
  ]);
}