'use server';

// Debugging: Log to indicate that this file is being executed
import { google } from 'googleapis';

import type { Company } from '@/lib/data';

// The ID of your Google Sheet, read from environment variables.
const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
// The name of the sheet (tab), read from environment variables.
const SHEET_NAME = process.env.SHEET_NAME || 'Company List';

/**
 * Initializes and returns an authenticated Google Sheets API client.
 * Uses a service account JSON string from environment variables.
 */
async function getSheetsClient() {
  const credentialsJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJsonString) {
    console.error('CREDENTIALS_JSON_NOT_SET: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
    throw new Error('CREDENTIALS_JSON_NOT_SET: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
  }

  try {
    const credentials = JSON.parse(credentialsJsonString);
    const auth = google.auth.fromJSON(credentials);
    if (auth === null) {
      throw new Error('Google Auth client is null after parsing JSON. Check credentials format.');
    }
    // @ts-ignore - The type of auth is broad, but fromJSON provides a client with scopes.
    auth.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('Failed to initialize Google Sheets client from JSON:', error);
    if (error instanceof SyntaxError) {
      throw new Error(`INVALID_JSON: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's a valid JSON string on a single line. Original error: ${error.message}`);
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Parses a single row from the sheet into a Company object using a header mapping.
 */
function parseRowToCompany(row: any[], headerMap: Map<string, number>, rowNumber: number): Company | null {
    if (!row || row.length === 0 || row.every(cell => cell === null || cell === '')) {
        return null;
    }

    const company: Company = {
        id: rowNumber,
    };

    headerMap.forEach((index, headerName) => {
        company[headerName] = row[index] || '';
    });

    return company;
}

/**
 * Fetches company data from the Google Sheet using the authenticated API.
 */
export async function getCompaniesFromSheet(): Promise<{ headers: string[], companies: Company[] }> {
    try {
        const sheets = await getSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:Z`, 
        });

        const allRows = response.data.values;
        if (!allRows || allRows.length <= 1) {
            return { headers: [], companies: [] };
        }
        
        const headers = allRows[0].map(header => header || '');
        const dataRows = allRows.slice(1);

        const headerMap = new Map<string, number>();
        headers.forEach((header, index) => {
            if (header) {
                headerMap.set(header, index);
            }
        });

        const companies: Company[] = [];
        dataRows.forEach((row, index) => {
          const rowNumber = index + 2;
          const company = parseRowToCompany(row, headerMap, rowNumber);
          if (company) {
            companies.push(company);
          }
        });    
        
        return { headers, companies };

    } catch (error: any) {
       console.error('Error fetching sheet data via API:', error);
       if (error.message.includes('Unable to parse range')) {
           throw new Error(`Could not find sheet named "${SHEET_NAME}". Please check your SHEET_NAME environment variable and Google Sheet.`);
       }
       throw new Error(`Could not load data from Google Sheet: ${error.message}`);
    }
}

/**
 * Appends a new company row to the Google Sheet.
 */
export async function addCompanyToSheet(companyData: Omit<Company, 'id'>, headers: string[]): Promise<Company> {
    const sheets = await getSheetsClient();

    const values = [headers.map(header => {
        return companyData[header] || '';
    })];

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
export async function updateSheetCell({ companyId, columnName, newValue, headers }: { companyId: number, columnName: string, newValue: string, headers: string[] }): Promise<void> {
    const sheets = await getSheetsClient();    
    const columnIndex = headers.indexOf(columnName);

    if (columnIndex === -1) {
        throw new Error(`Column "${columnName}" not found in headers. The column name is case-sensitive.`);
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
