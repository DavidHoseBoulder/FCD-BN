'use server';

import type { Company } from '@/lib/data';
import { google } from 'googleapis';

const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const SHEET_NAME = 'Companies';
const RANGE = `${SHEET_NAME}!A:G`;

async function getSheetsClient() {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    throw new Error('SA_KEY_NOT_SET: Google service account credentials are not set in environment variables.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: SERVICE_ACCOUNT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}


export async function getCompaniesFromSheet(): Promise<Company[]> {
    // Public read access via CSV export
    const publicCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

    try {
        const response = await fetch(publicCsvUrl);
        if (!response.ok) {
             throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
        }
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1).map(row => 
            row.split(',').map(cell => JSON.parse(cell))
        );

        return rows.map((row, index) => ({
            id: index + 1, // simplified ID generation
            name: row[1] || '',
            industry: row[2] || '',
            city: row[3] || '',
            yearFounded: parseInt(row[4], 10) || 0,
            employees: parseInt(row[5], 10) || 0,
            funding: parseInt(row[6], 10) || 0,
        })).filter(c => c.name);

    } catch (error) {
       console.error('Error fetching public sheet data:', error);
       throw new Error("Could not load data from the public Google Sheet. Please ensure it's shared with 'Anyone with the link'.");
    }
}

export async function addCompanyToSheet(companyData: Omit<Company, 'id'>): Promise<Company> {
    const sheets = await getSheetsClient();

    // First, get all existing IDs to determine the next one
    const idResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:A`,
    });
    const ids = idResponse.data.values?.map(row => parseInt(row[0], 10)).filter(id => !isNaN(id)) || [];
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    
    const newCompany: Company = { ...companyData, id: newId };
    
    const values = [[
        newCompany.id,
        newCompany.name,
        newCompany.industry,
        newCompany.city,
        newCompany.yearFounded,
        newCompany.employees,
        newCompany.funding,
    ]];

    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: RANGE,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values,
        },
    });

    return newCompany;
}
