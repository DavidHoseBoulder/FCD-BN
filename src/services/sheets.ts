'use server';

import type { Company } from '@/lib/data';
import { google } from 'googleapis';

const SHEET_ID = process.env.SHEET_ID || '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
const SHEET_NAME = 'Companies';

const HEADERS = [
  "Company Name", "Ecosystem Category", "Category", 
  "Management Team (CEO/Key Execs)", "Headquarters", "Funding/Investors", 
  "Key Customers / Segment", "Core Offering / Competitive Strengths", 
  "Areas Addressed", "Est. Annual Revenue", "# Employees", "Notes & Source (for Rev & Emp)",
  "Still Exists?"
];

async function getSheetsClient() {
  // When running on App Hosting, Google's auth library automatically
  // finds and uses the associated service account credentials.
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    // Explicitly setting the project ID can resolve authentication issues in some environments.
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
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

export async function addCompanyToSheet(companyData: Omit<Company, 'id'>): Promise<Company> {
    const sheets = await getSheetsClient();

     const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:A`,
    });

    const numRows = response.data.values ? response.data.values.length : 0;
    const newId = numRows + 2; 

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
        range: `${SHEET_NAME}!A${newId}`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values,
        },
    });

    return newCompany;
}

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
