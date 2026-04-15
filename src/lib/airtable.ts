'use server';

export async function saveLead(email: string, url: string): Promise<void> {
  const airtableBaseId = process.env.AIRTABLE_BASE_ID
  const airtableApiKey = process.env.AIRTABLE_API_KEY

  if (airtableBaseId && airtableApiKey) {
    try {
      await fetch(`https://api.airtable.com/v0/${airtableBaseId}/Concurrent Leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Email: email,
                URL: url,
                Datum: new Date().toISOString().split('T')[0],
              },
            },
          ],
        }),
      })
    } catch (airtableError) {
      console.error('Airtable error:', airtableError)
    }
  } else {
    console.log('Airtable niet geconfigureerd, lead opgeslagen in logs:', email)
  }
}
