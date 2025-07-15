
// This is a test comment to force a build
'use server';

import { google, Auth } from 'googleapis';
import type { Company } from '@/lib/data';

// The ID of your Google Sheet, read from environment variables.
const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
// The name of the sheet (tab), read from environment variables.
const SHEET_NAME = process.env.SHEET_NAME || 'Company List';

/**
 * Initializes and returns an authenticated Google Sheets API client.
 * Uses a service account JSON string from environment variables.
 */
/*\n\
async function getSheetsClient() {
  const credentialsJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJsonString) {
    const errorMsg = 'CREDENTIALS_JSON_NOT_SET: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set for local development. Please create a .env.local file with the service account JSON.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
    
  try {
    const credentials = JSON.parse(credentialsJsonString);
    const auth = new Auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();

    return google.sheets({ 
        version: 'v4', 
        auth: authClient,
    });
  } catch (error: any) {
    console.error('Failed to initialize Google Sheets client from JSON:', error);
    if (error instanceof SyntaxError) {
      throw new Error(`INVALID_JSON: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's a valid JSON string on a single line. Original error: ${error.message}`);
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
*/

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

    // Ensure core fields exist to prevent runtime errors
    company['Company Name'] = company['Company Name'] || 'Unknown Company';

    return company;
}

/**
 * Fetches company data from the Google Sheet using the authenticated API.
 */
export async function getCompaniesFromSheet(): Promise<{ headers: string[], companies: Company[] }> {
  /*\n\
    try {
        const sheets = await getSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${SHEET_NAME}!A:Z`, 
        });

        // Log the raw data received from the Google Sheet API
        console.log("Sheets API raw response values:", response.data.values);

        // Add logging for specific header index
        if (response.data.values && response.data.values.length > 0) {
            const headerRow = response.data.values[0];
            console.log("Full header row values:", headerRow);
            console.log("Value at header index 14:", headerRow[14]); // Index 14 corresponds to column O
        }

        const allRows = response.data.values;
        if (!allRows || allRows.length <= 1) {
            console.log("Sheet is empty or has only a header row.");
            const headersResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: `${SHEET_NAME}!1:1`,
            });
            const headers = headersResponse.data.values?.[0] || [];
            return { headers, companies: [] };
        }
        
        const headers = allRows[0].map(header => header || '');
        const dataRows = allRows.slice(1);
        
        // Log the extracted headers
        console.log("SERVER LOG: Headers fetched from Google Sheet:", headers);

        const headerMap = new Map<string, number>();
        headers.forEach((header, index) => {
            if (header) {
                headerMap.set(header, index);
            }
        });

        const companies: Company[] = [];
        dataRows.forEach((row, index) => {
          const rowNumber = index + 2; // +1 for slice, +1 for header row
          const company = parseRowToCompany(row, headerMap, rowNumber);
          if (company) {
            companies.push(company);
          }
        });    
        
        console.log(`Fetched ${headers.length} headers and ${companies.length} rows.`);
        return { headers, companies };

    } catch (error: any) {
       console.error('Error fetching sheet data via API:', error);
       if (error.message.includes('Unable to parse range')) {
           throw new Error(`Could not find sheet named "${SHEET_NAME}". Please check your SHEET_NAME environment variable and Google Sheet.`);
       }
       throw new Error(`Could not load data from Google Sheet: ${error.message}`);
    }
}
*/

/**
 * Appends a new company row to the Google Sheet.
 */
export async function addCompanyToSheet(newCompanyData: Omit<Company, 'id'>, headers: string[]): Promise<Company> {
    const sheets = await getSheetsClient();

    // Create the row array in the same order as the headers
    const values = [headers.map(header => {
        // Use the value from companyData if it exists, otherwise default to an empty string
        return newCompanyData[header] || '';
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
    
    // Example updatedRange: 'Company List'!A15:R15
    const match = updatedRange.match(/(\d+):/);
    if (!match || !match[1]) {
        throw new Error("Could not parse the new row number from the update response.");
    }
    const newId = parseInt(match[1], 10);

    return { ...companyData, id: newId };
}
*/

/**
 * Updates a single cell in the Google Sheet.
 */
export async function updateSheetCell({ companyId, columnName, newValue, headers }: { companyId: number, columnName: string, newValue: string, headers: string[] }): Promise<void> {
    const sheets = await getSheetsClient();    
    const columnIndex = headers.indexOf(columnName);

    if (columnIndex === -1) {
        throw new Error(`Column "${columnName}" not found in headers. The column name is case-sensitive.`);
    }

    // Convert 0-based index to 1-based column letter
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
*/
