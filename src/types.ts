export interface RawTransaction {
  "Address": string;
  "Sale Date": string;
  "Sale PSF": number | string;
  "Sale Price": number | string;
  "Area (sqft)": number | string;
  "Sub Type": string;
  "Tenure": string;
  "Tenure From": string;
  "Transaction Ty": string;
  "Purchase Date": string;
  "Purchase PSF": number | string;
  "Purchase Price": number | string;
  "Profit PSF": number | string;
  "Profit": number | string;
  "Holding Years": number | string;
  "Annualised": number | string;
}

export interface Transaction {
  transactedPrice: number;
  areaSqft: number;
  unitPricePsf: number;
  saleDate: Date;
  originalSaleDate: string;
  fullAddress: string;
  streetName: string;
  propertyType: string;
  tenure: string;
  profit: number;
  purchasePrice: number;
  purchasePsf: number;
}

export interface Filters {
    startDate: string;
    endDate: string;
    propertyTypes: string[];
    tenures: string[];
    streetName: string[];
}

export interface Kpi {
  totalTransactions: number;
  totalSalesVolume: number;
  averagePricePsf: number;
  averageProfit: number;
  highestTransaction: number;
}

export interface QuarterlyKpiReport {
    current: Kpi | null;
    previous: Kpi | null;
}