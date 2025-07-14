'use server';

// Debugging: Log to indicate that this file is being executed
console.log('sheets.ts is being executed');
import type { Company } from '@/lib/data';
import { google } from 'googleapis';
import { HEADERS } from '@/lib/sheets-constants';

// The ID of your Google Sheet, read from environment variables.
const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
// The name of the sheet (tab), read from environment variables.
const SHEET_NAME = process.env.SHEET_NAME || 'Company List';

/**
 * Initializes and returns an authenticated Google Sheets API client.
 * Uses a service account JSON string from environment variables.
 */
async function getSheetsClient() {
  console.log('Attempting to initialize Google Sheets client...');
  const credentialsJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJsonString) {
    console.error('CREDENTIALS_JSON_NOT_SET: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
    throw new Error('CREDENTIALS_JSON_NOT_SET: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.');
  } 

  try {
    const credentials = JSON.parse(credentialsJsonString);
    console.log(`Successfully parsed credentials for project: ${credentials.project_id}`);

    const auth = google.auth.fromJSON(credentials);
    if (auth === null) {
      throw new Error('Google Auth client is null after parsing JSON. Check credentials format.');
    }
    // @ts-ignore - The type of auth is broad, but fromJSON provides a client with scopes.
    auth.scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    console.log('Google Sheets client initialized successfully.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('Failed to initialize Google Sheets client from JSON:', error);
    if (error instanceof SyntaxError) {
      throw new Error(`INVALID_JSON: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's a valid JSON string on a single line. Original error: ${error.message}`);
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
}


function parseRowToCompany(row: string[], rowNumber: number): Company | null {
    if (!row || row.length === 0 || row.every(cell => cell === '')) {
      return null;
    }

    return {
        id: rowNumber,
        name: row[0] || '',
        url: row[1] || '',
        targeting: row[2] || '',
        ecosystemCategory: row[3] || '',
        category: row[4] || '',
        ceo: row[5] || '',
        headquarters: row[6] || '',
        funding: row[7] || '',
        customers: row[8] || '',
        offering: row[9] || '',
        areasAddressed: row[10] || '',
        revenue: row[11] || '',
        employees: row[12] || '',
        notes: row[13] || '',
        pitchbookInfo: row[14] || '',
        stillExists: row[15] || '',
    };
}

/**
 * Fetches company data from the Google Sheet using the authenticated API.
 */
export async function getCompaniesFromSheet(): Promise<Company[]> {
    try {
        const sheets = await getSheetsClient();
        console.log('Making API call to get sheet data.');
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            // Fetch a wider range to accommodate all potential columns
            range: `${SHEET_NAME}!A:Z`, 
        });

        const allRows = response.data.values;
        if (!allRows || allRows.length <= 1) { // <= 1 to account for only a header row
            console.log('Sheet is empty or only contains a header.');
            return [];
        }
        
        // Assume first row is the header
        const headerRow = allRows[0];
        const dataRows = allRows.slice(1);

        console.log("Sheet Header:", headerRow);


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

        console.log(`Finished fetching data. Found ${companies.length} companies.`);
        
        return companies;

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
export async function addCompanyToSheet(companyData: Omit<Company, 'id'>): Promise<Company> {
    const sheets = await getSheetsClient();

    // The order here MUST match the HEADERS array
    const values = [[
        companyData.name,
        companyData.url,
        companyData.targeting,
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
        companyData.notes,
        companyData.pitchbookInfo,
        companyData.stillExists
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
    
    // Extract the row number from the range string (e.g., 'Company List'!A82:P82 -> 82)
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
        throw new Error(`Column "${columnName}" not found in HEADERS constant. The column name is case-sensitive.`);
    }

    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + columnIndex);
    const range = `${SHEET_NAME}!${columnLetter}${companyId}`;
    console.log(`Updating cell: ${range} with value: "${newValue}"`);

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newValue]],
        },
    });
}
