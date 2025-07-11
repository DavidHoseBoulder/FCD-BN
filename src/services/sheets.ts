import type { Company } from '@/lib/data';
import { companies as fallbackData } from '@/lib/data';

const SHEET_ID = '1Ip8OXKy-pO-PP5l6utsK2kwcagNiDPgyKrSU1rnU2Cw';
const GID = '438990019';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

function parseCSV(csvText: string): Company[] {
    const lines = csvText.trim().split(/\r\n|\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const companies: Company[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values: (string | number)[] = lines[i].split(',');
        const company = {} as any;
        for(let j = 0; j < headers.length; j++) {
            const header = headers[j];
            let value: string | number = values[j];

            if (header === 'id' || header === 'yearFounded' || header === 'employees' || header === 'funding') {
                value = Number(value);
            }
            company[header] = value;
        }
        companies.push(company as Company);
    }
    return companies;
}

export async function getCompaniesFromSheet(): Promise<Company[]> {
    try {
        const response = await fetch(CSV_URL, {
            next: {
                revalidate: 3600 // Revalidate every hour
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch sheet data: ${response.statusText}. Falling back to local data.`);
            return fallbackData;
        }

        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        if (parsedData.length === 0) {
            return fallbackData;
        }
        return parsedData;
    } catch (error) {
        console.error("Error fetching or parsing sheet data. Falling back to local data:", error);
        return fallbackData;
    }
}
