
'use server';

import type { Company } from '@/lib/data';
import { google } from 'googleapis';

// The ID of your Google Sheet.
const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
// The name of the sheet (tab) within your Google Sheet.
const SHEET_NAME = 'Companies';


// This header list MUST match the columns in your Google Sheet exactly.
// This is used to map column names to their index when updating a cell.
export const HEADERS = [
  "Company Name", "Ecosystem Category", "Category", 
  "Management Team (CEO/Key Execs)", "Headquarters", "Funding/Investors", 
  "Key Customers / Segment", "Core Offering / Competitive Strengths", 
  "Areas Addressed", "Est. Annual Revenue", "# Employees", "Notes & Source (for Rev & Emp)",
  "Still Exists?"
];


/**
 * Initializes and returns an authenticated Google Sheets API client.
 * This function uses a service account key provided via environment variables.
 * This is the most reliable authentication method in environments with strict
 * organization policies.
 * 
 * The following environment variables must be set as secrets in App Hosting:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: The client_email from the JSON key file.
 * - GOOGLE_PRIVATE_KEY: The private_key from the JSON key file.
 */
async function getSheetsClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('SA_KEY_NOT_SET: The GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables must be set.');
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}


function parseRowToCompany(row: string[], index: number): Company | null {
    if (!row[0]) {
      return null;
    }

    return {
        id: index + 2, // Sheet rows are 1-based, and we skip the header, so data starts at row 2
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


/**
 * Fetches company data from the public-facing CSV export of the Google Sheet.
 * This method does not require authentication and is suitable for read-only public data.
 */
export async function getCompaniesFromSheet(): Promise<Company[]> {
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
          .slice(1) 
          .map(row => {
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

/**
 * Appends a new company row to the Google Sheet.
 * Requires authenticated access via the service account.
 */
export async function addCompanyToSheet(companyData: Omit<Company, 'id'>): Promise<Company> {
    const sheets = await getSheetsClient();

     const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:A`,
    });

    const numRows = response.data.values ? response.data.values.length : 0;
    const newId = numRows + 1; 

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
        '', // Notes
        '', // Still Exists?
    ]];

    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values,
        },
    });

    return newCompany;
}

/**
 * Updates a single cell in the Google Sheet.
 * Requires authenticated access via the service account.
 */
export async function updateSheetCell({ companyId, columnName, newValue }: { companyId: number, columnName: string, newValue: string }): Promise<void> {
    const sheets = await getSheetsClient();
    const columnIndex = HEADERS.indexOf(columnName);

    if (columnIndex === -1) {
        throw new Error(`Column "${columnName}" not found.`);
    }

    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + columnIndex);
    const range = `${SHEET_NAME}!${columnLetter}${companyId}`;

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newValue]],
        },
    });
}
