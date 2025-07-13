
'use server';

import type { Company } from '@/lib/data';
import { google } from 'googleapis';
import { HEADERS } from '@/lib/sheets-constants';

// The ID of your Google Sheet.
const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
// The name of the sheet (tab) within your Google Sheet.
const SHEET_NAME = 'Companies';

// Service account credentials are embedded directly.
const credentials = {
  client_email: 'firebase-app-hosting-compute@sheetsurfer-j1dsc.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCQs7q5s8qtTERF\nZ7nuzy5p5DC/3h1g0f+HjkHlpruGPYdVDQvPPaApwc7T7gjTczr12Ali+susxiXW\n+V8As3rakKLYRkFK3BI9ykkar3enC+HbiUfzLiAnekPqINL4U3IcmNVfzFlEEI7+\njygCc71y5L7yRJGOQTSITRqFpmgGYHznPMeyOtW9gnDhcE8XdviG6L08hi1ouiD2\nkIVzDgsCvT5U7y44voUmwJbRkURATBOd1nA+Dag1TyAyUaINabHw/ewDLT6lDzi2\nqPP41/bGmD29QDIGjBYltKi4k1akGPhn8se36o4ACc+egMMWsa3nWR7+B73o2i3y\ng4jNCy+bAgMBAAECggEACRTmpA9h1Io5V1vLt8O+sicAB5gNTaLQaqBl3V/KBten\naJHxive0rM+SR2B5+FS+lL29f736ziSqLPmor0Fpyqbnjt2rQmNZLRHxkEsGnkV+\nJDT+VDJcZ+3iA6M8v8NzoXzWw3TuqKQbaA7xtWRbNbH1PqeetQgS9SJVsaFV3QnV\nZJzILCodcFcXsH04XhyClNy7X1ytyMTb7x7f0hgZLkx9EEevEbQcp9mGWSGDhnGt\nyv6HvYapdHoMmB2w8GQsHKZlo68HCImL7qkED0FpyiOW850cu8pxgib/S56NyCu8\nf+Y0HjkP4DyiYWybvHdMmi56lWES/+JHj+CdfwPceQKBgQDIUXCzcGZw39IeyqDE\nRK9NxVnc6AWV+MZnGPs6TUT9ZY0SZ7IG4jExiDc3SmnCS4yKOOuX6OaojhzoOC3B\n0c7mzHasskbq78XCxjdozxBureROafrjrMq4r4fBAMxEjvjoh2mcQRWU9YWobb0+\nxuFL/dTL2jwbuQ2Pps1ZLBOMUwKBgQC47KwSCmXvD3e+UWIlJ+OkUoEDcqdrb/64\nJ74gRvQYXfahMx44Ri6oxnOo/de1E+gsqvfZSziNH9tcCM+Rzm4lqOu5jHZq+J/u\n+0QYaI9GZlqNxgPXCKg2U/bajAsSs4h6dAUDpWV3GSbz+XG22GfuOJ4og8zFkoDr\nDC+CJlgmmQKBgQCRrdCFXq/RVKStqfTC56SJrYVNxxsQ1wwKvDswSjNrCOhQQ0NQ\nCD14ZTSqrB4/o8vAVebX4hOk7z0MkJaORvPuGzIPI9O5Vch/fsGbIkM0CphngmFo\nJCiFqXnTna3wCf3wtVHTxe1ZGDkspSoktmPwbNfNrJdcHfdDyi26tPg+awKBgQCQ\napxytlYm3TCJm+sG02EPGjOQ6sBewibt0HPFp0PHp9IMz+wAzKZxvhHjXuJPks1V\n3OsUco8mf0ODW4om90zD8mitDkoIfkQAkY/7c+S4eQStBYBINYWQcAAvawDWyQiD\ngQnNcCSOX0ExdZPd1KFNxD+Xql6HyUMOzQRpIuLiuQKBgGLmN5HtVzLqEY4wGi0w\nnjIGZ5j55RyMbRRj6sp3gRCXUWilw51oQb3L4gD1aVr6rCpSYdiJ6DHSK7g0wOXA\n9ZczZQ3hZsQHwD+0P4NrEevo5IjHBQ4PLeZ624Z9TrTcyg6zCjz/M6BeLZwj/yHh\n2fqa8+AVb5+BQuAW3OmgEyvU\n-----END PRIVATE KEY-----`.replace(/\\n/g, '\n'),
};

/**
 * Initializes and returns an authenticated Google Sheets API client.
 */
async function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}


function parseRowToCompany(row: string[], rowNumber: number): Company | null {
    if (!row || !row[0]) {
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
 * This is the reliable method for reading data to prevent index mismatches.
 */
export async function getCompaniesFromSheet(): Promise<Company[]> {
    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            // Start from A2 to skip the header row
            range: `${SHEET_NAME}!A2:Z`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return [];
        }
        
        const companies: Company[] = [];
        rows.forEach((row, index) => {
          // The actual row number in the sheet is index + 2 
          // (because our range starts at A2, and arrays are 0-indexed)
          const rowNumber = index + 2; 
          const company = parseRowToCompany(row, rowNumber);

          if (company) {
            companies.push(company);
          }
        });
        
        return companies;

    } catch (error: any) {
       console.error('Error fetching sheet data via API:', error);
       throw new Error(`Could not load data from Google Sheet: ${error.message}`);
    }
}

/**
 * Appends a new company row to the Google Sheet.
 * Requires authenticated access via the service account.
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
    
    // Extract the row number from the range string (e.g., 'Companies'!A82:K82 -> 82)
    const match = updatedRange.match(/(\d+):/);
    if (!match || !match[1]) {
        throw new Error("Could not parse the new row number from the update response.");
    }
    const newId = parseInt(match[1], 10);

    return { ...companyData, id: newId };
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
