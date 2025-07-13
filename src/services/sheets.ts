'use server';

import type { Company } from '@/lib/data';
import { google } from 'googleapis';
import { HEADERS } from '@/lib/sheets-constants';

// The ID of your Google Sheet, read from environment variables.
const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
// The name of the sheet (tab), read from environment variables.
const SHEET_NAME = process.env.SHEET_NAME || 'Company List';

/**
 * Initializes and returns an authenticated Google Sheets API client.
 * Uses service account credentials from environment variables.
 */
async function getSheetsClient() {
  const sa_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // The private key must have newlines replaced with actual newlines.
  // This handles both single-line format with escaped newlines and multi-line format.
  const sa_key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!sa_email || !sa_key) {
    throw new Error('SA_KEY_NOT_SET: Google Service Account credentials are not set in environment variables.');
  }

  const auth = new google.auth.JWT({
    email: sa_email,
    key: sa_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}


function parseRowToCompany(row: string[], rowNumber: number): Company | null {
    if (!row || row.length === 0 || row.every(cell => cell === '')) {
      return null;
    }

    return {
        id: rowNumber,
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
 * Fetches company data from the Google Sheet using the authenticated API.
 */
export async function getCompaniesFromSheet(): Promise<Company[]> {
    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: SHEET_NAME, // Request the entire sheet
        });

        const allRows = response.data.values;
        if (!allRows || allRows.length <= 1) { // <= 1 to account for only a header row
            return [];
        }
        
        // Remove header row (the first row)
        const dataRows = allRows.slice(1);

        const companies: Company[] = [];
        dataRows.forEach((row, index) => {
          // The actual row number in the sheet is index + 2 
          // (because we sliced off the header, and sheets are 1-indexed)
          const rowNumber = index + 2; 
          const company = parseRowToCompany(row, rowNumber);

          if (company) {
            companies.push(company);
          }
        });
        
        return companies;

    } catch (error: any) {
       console.error('Error fetching sheet data via API:', error);
       // Re-throw with a more user-friendly message
       if (error.message.includes('Unable to parse range')) {
           throw new Error(`Could not find sheet named "${SHEET_NAME}". Please check your .env file and Google Sheet.`);
       }
       throw new Error(`Could not load data from Google Sheet: ${error.message}`);
    }
}

/**
 * Appends a new company row to the Google Sheet.
 */
export async function addCompanyToSheet(companyData: Omit<Company, 'id'>): Promise<Company> {
    const sheets = await getSheetsClient();

    const values = [[
        companyData.name,
        companyData.ecosystemCategory,
        companyData.category,
        companyData.ceo,
        companyData.headquarters,
        companyData.funding,
        companyData.customers,
        companyData.offering,
        companyData.areasAddressed,
        companyData.revenue,
        companyData.employees,
    ]];

    const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values,
        },
    });

    const updatedRange = appendResponse.data.updates?.updatedRange;
    if (!updatedRange) {
        throw new Error("Could not determine the new row's ID after adding it.");
    }
    
    // Extract the row number from the range string (e.g., 'Company List'!A82:K82 -> 82)
    const match = updatedRange.match(/(\d+):/);
    if (!match || !match[1]) {
        throw new Error("Could not parse the new row number from the update response.");
    }
    const newId = parseInt(match[1], 10);

    return { ...companyData, id: newId };
}

/**
 * Updates a single cell in the Google Sheet.
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
