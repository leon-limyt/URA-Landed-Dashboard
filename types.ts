export interface RawTransaction {
  "Project Name": string;
  "Transacted Price ($)": number;
  "Area (SQFT)": string;
  "Unit Price ($ PSF)": number;
  "Sale Date": string;
  "Street Name": string;
  "Area (SQM)": string;
  "Unit Price ($ PSM)": number;
  "Property Type": string;
  "Tenure": string;
  "Postal District": string;
}

export interface Transaction {
  projectName: string;
  transactedPrice: number;
  areaSqft: number;
  unitPricePsf: number;
  saleDate: Date;
  originalSaleDate: string;
  streetName: string;
  areaSqm: number;
  unitPricePsm: number;
  propertyType: string;
  tenure: string;
  postalDistrict: string;
}

export interface Filters {
    startDate: string;
    endDate: string;
    propertyTypes: string[];
    tenures: string[];
    streetName: string[];
}