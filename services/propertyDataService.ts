import { RawTransaction, Transaction } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZ6ctqIY7QRwhcHE8Z_aqAutAi7kNLUb5Oeo-olfE0AGiIhRVr6FDqsmvVCRxJ67vm/exec';

const monthMap: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
};

// A robust function to parse numeric values that might be null, undefined, or contain commas.
const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
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
            if (typeof dateStr !== 'string' || !dateStr.trim()) {
                console.warn("Skipping row with empty date", raw);
                continue;
            }

            let saleDate: Date;

            // Attempt to parse as an ISO 8601 string first, as it's a more standard format.
            const isoDate = new Date(dateStr);
            if (!isNaN(isoDate.getTime())) {
                saleDate = isoDate;
            } else {
                // Fallback to the original 'MMM-YY' parsing logic.
                const parts = dateStr.trim().split('-');
                if (parts.length !== 2) {
                    console.warn(`Skipping row with invalid date format: "${dateStr}"`, raw);
                    continue;
                }
                
                const monthStr = parts[0].slice(0, 3).toLowerCase();
                const yearPart = parseInt(parts[1], 10);

                const monthIndex = monthMap[monthStr];

                if (monthIndex === undefined || isNaN(yearPart)) {
                    console.warn(`Could not parse month/year from date: "${dateStr}"`, raw);
                    continue;
                }

                const fullYear = yearPart < 100 ? 2000 + yearPart : yearPart;
                const parsedDate = new Date(Date.UTC(fullYear, monthIndex, 1));
                
                if (isNaN(parsedDate.getTime())) {
                    console.warn(`Constructed an invalid date for raw row:`, raw);
                    continue;
                }
                saleDate = parsedDate;
            }
             
            if (isNaN(saleDate.getTime())) {
                console.warn(`Could not process date string into a valid date: "${dateStr}"`, raw);
                continue;
            }

            transactions.push({
                projectName: raw["Project Name"],
                transactedPrice: parseNumber(raw["Transacted Price ($)"]),
                areaSqft: parseNumber(raw["Area (SQFT)"]),
                unitPricePsf: parseNumber(raw["Unit Price ($ PSF)"]),
                saleDate: saleDate,
                originalSaleDate: dateStr,
                streetName: raw["Street Name"],
                areaSqm: parseNumber(raw["Area (SQM)"]),
                unitPricePsm: parseNumber(raw["Unit Price ($ PSM)"]),
                propertyType: raw["Property Type"],
                tenure: raw["Tenure"],
                postalDistrict: raw["Postal District"],
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