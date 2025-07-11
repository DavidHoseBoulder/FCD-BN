'use server';

import type { Company } from '@/lib/data';
import { companies as fallbackData } from '@/lib/data';
import { google } from 'googleapis';

const SHEET_ID = process.env.SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const SHEET_NAME = 'Companies';
const RANGE = `${SHEET_NAME}!A:G`;

async function getSheetsClient() {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
    throw new Error('SA_KEY_NOT_SET: Google service account credentials or Sheet ID are not set in environment variables.');
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
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return [];
    }
    
    const headers = rows[0];
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, i) => {
        headerMap[header.trim()] = i;
    });

    const companies: Company[] = rows.slice(1).map((row, index) => {
        const id = parseInt(row[headerMap['id']], 10) || index + 1;
        if (!row[headerMap['name']]) return null;
        return {
            id: id,
            name: row[headerMap['name']] || '',
            industry: row[headerMap['industry']] || '',
            city: row[headerMap['city']] || '',
            yearFounded: parseInt(row[headerMap['yearFounded']], 10) || 0,
            employees: parseInt(row[headerMap['employees']], 10) || 0,
            funding: parseInt(row[headerMap['funding']], 10) || 0,
        };
    }).filter((c): c is Company => c !== null);

    return companies;
  } catch (error) {
     console.error('Error fetching data from Google Sheets:', error);
     throw error;
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
