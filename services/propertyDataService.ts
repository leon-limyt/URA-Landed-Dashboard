import { RawTransaction, Transaction } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZ6lEYBuuxgv4Uyso9HnPzAz_E_kFjBcvwoUJXMI5eSnPVSIfO6PGI9WvI5vxqd-R-3Q/exec';

const monthMap: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

// A robust function to parse numeric values that might be null, undefined, or contain commas/currency.
const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '' || value === '-') return 0;
    const num = Number(String(value).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
};

const extractStreetName = (fullAddress: string): string => {
    if (typeof fullAddress !== 'string' || !fullAddress) {
        return 'N/A';
    }
    // Removes leading house number like "8 ", "33 ", "3B ", "527B " etc.
    return fullAddress.replace(/^\d+[A-Z]*\s+/, '').trim();
};

export const fetchPropertyData = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'GET',
      redirect: 'follow',
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server responded with an error:", response.status, errorText);
        throw new Error(`Data service responded with status ${response.status}.`);
    }

    const rawText = await response.text();
    const result = JSON.parse(rawText);
    
    const rawData = Array.isArray(result) ? result : result?.data;

    if (!Array.isArray(rawData)) {
        console.error("Fetched data is not in the expected format (expected an array):", result);
        return [];
    }
    
    const transactions: Transaction[] = [];

    for (const raw of rawData as RawTransaction[]) {
        try {
            const dateStr = raw["Sale Date"];
            if (typeof dateStr !== 'string' || !dateStr.trim() || dateStr.trim() === '-') {
                console.warn("Skipping row with empty date", raw);
                continue;
            }

            let saleDate: Date;

            // Handle ISO format like "2025-02-19T16:00:00.000Z" first
            if (dateStr.includes('T') && dateStr.includes('Z')) {
                saleDate = new Date(dateStr);
            } else {
                // Fallback to 'DD-Mon-YY' format like '22-Sep-25'
                const parts = dateStr.trim().split('-');
                if (parts.length !== 3) {
                    console.warn(`Skipping row with unhandled date format: "${dateStr}"`, raw);
                    continue;
                }
                
                const day = parseInt(parts[0], 10);
                const monthStr = parts[1].slice(0, 3).toLowerCase();
                const yearPart = parseInt(parts[2], 10);

                const monthIndex = monthMap[monthStr];

                if (monthIndex === undefined || isNaN(day) || isNaN(yearPart)) {
                    console.warn(`Could not parse DD-Mon-YY date components from: "${dateStr}"`, raw);
                    continue;
                }

                const fullYear = yearPart < 100 ? 2000 + yearPart : yearPart;
                saleDate = new Date(Date.UTC(fullYear, monthIndex, day));
            }
            
            if (isNaN(saleDate.getTime())) {
                console.warn(`Constructed an invalid date for raw row:`, raw, ` (date string: "${dateStr}")`);
                continue;
            }

            const fullAddress = raw["Address"];
            transactions.push({
                transactedPrice: parseNumber(raw["Sale Price"]),
                areaSqft: parseNumber(raw["Area (sqft)"]),
                unitPricePsf: parseNumber(raw["Sale PSF"]),
                saleDate: saleDate,
                originalSaleDate: dateStr,
                fullAddress: fullAddress,
                streetName: extractStreetName(fullAddress),
                propertyType: raw["Sub Type"],
                tenure: raw["Tenure"],
                profit: parseNumber(raw["Profit"]),
                purchasePrice: parseNumber(raw["Purchase Price"]),
                purchasePsf: parseNumber(raw["Purchase PSF"]),
            });
        } catch (e) {
            console.error("Failed to process row:", raw, e);
        }
    }

    return transactions;
    
  } catch (error: any) {
    console.error("Failed to fetch property data:", error);
    if (error.message.includes('Data service responded with status')) {
        throw error;
    }
    // This is the generic "Failed to fetch" case, often a CORS or network issue.
    throw new Error(
      "Failed to fetch data. This is likely due to a network issue or a browser security policy (CORS). Please ensure you are connected to the internet and check the browser's developer console for more details."
    );
  }
};
