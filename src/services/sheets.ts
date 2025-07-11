'use server';

import type { Company } from '@/lib/data';
import { google } from 'googleapis';

const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const SHEET_NAME = 'Companies';
// Update range to match the new number of columns
const RANGE = `${SHEET_NAME}!A:L`;

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

function parseRowToCompany(row: string[], index: number): Company | null {
    // The first column is used as an implicit ID, but it's not in the data model.
    // The actual company data starts from the second column in the sheet.
    // We'll use the row number (plus a starting number) for a unique key.
    if (!row[0]) {
      return null;
    }

    return {
        id: index + 1, // Use row index for a stable key
        name: row[0] || '',
        ecosystemCategory: row[1] || '',
        category: row[2] || '',
        ceo: row[3] || '',
        headquarters: row[4] || '',
        funding: row[5] || '',
        customers: row[6] || '',
        offering: row[7] || '',
        areasAddressed: row[8] || '',
        revenue: row[9] || '',
        employees: row[10] || '',
    };
}


export async function getCompaniesFromSheet(): Promise<Company[]> {
    // Public read access via CSV export
    const publicCsvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

    try {
        const response = await fetch(publicCsvUrl, { cache: 'no-store' });
        if (!response.ok) {
             throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
        }
        const csvText = await response.text();
        const rows = csvText
          .trim()
          .split('\n')
          .slice(1) // Skip header row
          .map(row => {
            // This regex handles quoted strings that may contain commas
            return (row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(cell => 
              cell.startsWith('"') && cell.endsWith('"') ? cell.substring(1, cell.length - 1) : cell
            );
          });
        
        return rows
          .map((row, index) => parseRowToCompany(row, index))
          .filter((c): c is Company => c !== null && !!c.name);

    } catch (error) {
       console.error('Error fetching public sheet data:', error);
       throw new Error("Could not load data from the public Google Sheet. Please ensure it's shared with 'Anyone with the link'.");
    }
}

export async function addCompanyToSheet(companyData: Omit<Company, 'id'>): Promise<Company> {
    const sheets = await getSheetsClient();

     const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:A`, // Check the first column for content to find the last row
    });

    const numRows = response.data.values ? response.data.values.length : 0;
    const newId = numRows + 1; // Simple incrementing ID

    const newCompany: Company = { ...companyData, id: newId };
    
    const values = [[
        newCompany.name,
        newCompany.ecosystemCategory,
        newCompany.category,
        newCompany.ceo,
        newCompany.headquarters,
        newCompany.funding,
        newCompany.customers,
        newCompany.offering,
        newCompany.areasAddressed,
        newCompany.revenue,
        newCompany.employees,
        '', // Notes & Source
    ]];

    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A${numRows + 2}`, // Append to the next available row
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values,
        },
    });

    return newCompany;
}
