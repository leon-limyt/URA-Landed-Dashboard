import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Filters, Kpi, QuarterlyKpiReport } from '../types';
import { fetchPropertyData } from '../services/propertyDataService';
import { GoogleGenAI } from '@google/genai';

export const usePropertyData = () => {
  const [allData, setAllData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialDateRange, setInitialDateRange] = useState({ startDate: '', endDate: '' });
  const [timeAggregation, setTimeAggregation] = useState<'Month' | 'Quarter' | 'Year'>('Month');
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    propertyTypes: [],
    tenures: [],
    streetName: [],
  });
  
  const [aiSummary, setAiSummary] = useState('');
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPropertyData();
        setAllData(data);
        if (data.length > 0) {
            // Set default date range from min/max dates in the data
            const dates = data.map(d => d.saleDate.getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const initialRange = {
                startDate: minDate.toISOString().split('T')[0],
                endDate: maxDate.toISOString().split('T')[0],
            };
            setInitialDateRange(initialRange);
            setFilters(prev => ({
                ...prev,
                ...initialRange,
            }));
        }
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred while loading data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const uniquePropertyTypes = useMemo(() => {
    const types = new Set(allData.map(d => d.propertyType));
    return Array.from(types).sort();
  }, [allData]);

  const uniqueTenures = useMemo(() => {
    const tenures = new Set(allData.map(d => d.tenure));
    return Array.from(tenures).sort();
  }, [allData]);

  const uniqueStreetNames = useMemo(() => {
    const streets = new Set(allData.map(d => d.streetName));
    return Array.from(streets).sort();
  }, [allData]);

  const filteredData = useMemo(() => {
    const { startDate, endDate, propertyTypes, tenures, streetName } = filters;

    // A robust function to parse 'YYYY-MM-DD' into a UTC date object.
    // `new Date(string)` is unreliable as it can parse into the browser's local timezone.
    const parseDateAsUTC = (dateString: string): Date | null => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        // Month is 0-indexed in Date.UTC, so subtract 1.
        return new Date(Date.UTC(year, month - 1, day));
    };
    
    const start = parseDateAsUTC(startDate);
    const end = parseDateAsUTC(endDate);
    
    if(end) {
        // Set to the very end of the day in UTC to make the filter inclusive.
        end.setUTCHours(23, 59, 59, 999);
    }

    return allData.filter(d => {
      const saleDate = d.saleDate;
      if (start && saleDate < start) return false;
      if (end && saleDate > end) return false;
      if (propertyTypes.length > 0 && !propertyTypes.includes(d.propertyType)) return false;
      if (tenures.length > 0 && !tenures.includes(d.tenure)) return false;
      if (streetName.length > 0 && !streetName.includes(d.streetName)) return false;
      return true;
    });
  }, [allData, filters]);

  const kpis: Kpi = useMemo(() => {
    const count = filteredData.length;
    if (count === 0) {
      return {
        totalTransactions: 0,
        totalSalesVolume: 0,
        averagePricePsf: 0,
        averageProfit: 0,
        highestTransaction: 0,
      };
    }

    const totalSalesVolume = filteredData.reduce((sum, d) => sum + d.transactedPrice, 0);
    const averagePricePsf = filteredData.reduce((sum, d) => sum + d.unitPricePsf, 0) / count;
    
    const profitableTransactions = filteredData.filter(d => d.profit > 0);
    const totalProfit = profitableTransactions.reduce((sum, d) => sum + d.profit, 0);
    const averageProfit = profitableTransactions.length > 0 ? totalProfit / profitableTransactions.length : 0;
      
    const highestTransaction = Math.max(...filteredData.map(d => d.transactedPrice));

    return {
      totalTransactions: count,
      totalSalesVolume,
      averagePricePsf,
      averageProfit,
      highestTransaction,
    };
  }, [filteredData]);

  const calculateKpisForData = useCallback((data: Transaction[]): Kpi | null => {
    const count = data.length;
    if (count === 0) return null;

    const totalSalesVolume = data.reduce((sum, d) => sum + d.transactedPrice, 0);
    const averagePricePsf = data.reduce((sum, d) => sum + d.unitPricePsf, 0) / count;
    const profitableTransactions = data.filter(d => d.profit > 0);
    const totalProfit = profitableTransactions.reduce((sum, d) => sum + d.profit, 0);
    const averageProfit = profitableTransactions.length > 0 ? totalProfit / profitableTransactions.length : 0;
    const highestTransaction = Math.max(...data.map(d => d.transactedPrice));

    return {
        totalTransactions: count,
        totalSalesVolume,
        averagePricePsf,
        averageProfit,
        highestTransaction,
    };
  }, []);

  const quarterlyKpis: QuarterlyKpiReport = useMemo(() => {
    if (filteredData.length === 0) {
      return { current: null, previous: null };
    }

    const getQuarter = (date: Date): { year: number; quarter: number } => {
        const month = date.getUTCMonth();
        const year = date.getUTCFullYear();
        const quarter = Math.floor(month / 3) + 1;
        return { year, quarter };
    };
    
    const latestDate = new Date(Math.max(...filteredData.map(d => d.saleDate.getTime())));
    const currentQuarterInfo = getQuarter(latestDate);

    let prevQuarterInfo;
    if (currentQuarterInfo.quarter === 1) {
        prevQuarterInfo = { year: currentQuarterInfo.year - 1, quarter: 4 };
    } else {
        prevQuarterInfo = { year: currentQuarterInfo.year, quarter: currentQuarterInfo.quarter - 1 };
    }
    
    const currentQuarterData = filteredData.filter(d => {
        const q = getQuarter(d.saleDate);
        return q.year === currentQuarterInfo.year && q.quarter === currentQuarterInfo.quarter;
    });

    const previousQuarterData = filteredData.filter(d => {
        const q = getQuarter(d.saleDate);
        return q.year === prevQuarterInfo.year && q.quarter === prevQuarterInfo.quarter;
    });

    return { 
        current: calculateKpisForData(currentQuarterData), 
        previous: calculateKpisForData(previousQuarterData) 
    };

  }, [filteredData, calculateKpisForData]);
  
  const comparativeMetrics = useMemo(() => {
    if (filteredData.length === 0) {
        return {
            currentMonth: null,
            previousMonth: null,
            currentYtd: null,
            previousYear: null,
        };
    }
    
    const latestDate = new Date(Math.max(...filteredData.map(d => d.saleDate.getTime())));
    const currentYear = latestDate.getUTCFullYear();
    const currentMonth = latestDate.getUTCMonth();

    // Month vs Month
    const currentMonthData = filteredData.filter(d => 
        d.saleDate.getUTCFullYear() === currentYear && d.saleDate.getUTCMonth() === currentMonth
    );
    
    const prevMonthDate = new Date(Date.UTC(currentYear, currentMonth, 1));
    prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
    const prevMonthYear = prevMonthDate.getUTCFullYear();
    const prevMonth = prevMonthDate.getUTCMonth();
    
    const previousMonthData = filteredData.filter(d => 
        d.saleDate.getUTCFullYear() === prevMonthYear && d.saleDate.getUTCMonth() === prevMonth
    );

    // YTD vs Previous Year
    const currentYtdData = filteredData.filter(d => 
        d.saleDate.getUTCFullYear() === currentYear
    );
    
    const previousYearData = filteredData.filter(d => 
        d.saleDate.getUTCFullYear() === currentYear - 1
    );

    return {
        currentMonth: calculateKpisForData(currentMonthData),
        previousMonth: calculateKpisForData(previousMonthData),
        currentYtd: calculateKpisForData(currentYtdData),
        previousYear: calculateKpisForData(previousYearData),
    };
  }, [filteredData, calculateKpisForData]);


  useEffect(() => {
    const generateSummary = async () => {
        if (kpis.totalTransactions === 0) {
            setAiSummary('Not enough data for the selected filters to generate a summary.');
            return;
        }

        setIsAiSummaryLoading(true);
        setAiSummaryError(null);
        
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});

        const { current, previous } = quarterlyKpis;
        const { currentMonth, previousMonth, currentYtd, previousYear } = comparativeMetrics;

        const formatKpiForPrompt = (kpi: Kpi | null, periodName: string): string => {
            if (!kpi || kpi.totalTransactions === 0) return `- ${periodName}: No data available.`;
            return `- ${periodName}:
  - Transactions: ${kpi.totalTransactions}
  - Avg Price (PSF): $${Math.round(kpi.averagePricePsf).toLocaleString()}
  - Avg Profit: $${Math.round(kpi.averageProfit).toLocaleString()}`;
        };

        const comparativeDataForPrompt = `
Here is time-based comparative data:
${formatKpiForPrompt(currentMonth, 'Current Month')}
${formatKpiForPrompt(previousMonth, 'Last Month')}
${formatKpiForPrompt(current, 'Current Quarter')}
${formatKpiForPrompt(previous, 'Last Quarter')}
${formatKpiForPrompt(currentYtd, 'Current YTD')}
${formatKpiForPrompt(previousYear, 'Last Year')}
        `;
        
        const tenureMap: { [key: string]: string } = { 'FH': 'Freehold' };
        const expandTenure = (t: string) => tenureMap[t] || t;

        const formatFiltersForPrompt = (tenures: string[], propertyTypes: string[]): string => {
            const allFilters = [
                ...tenures.map(expandTenure),
                ...propertyTypes,
            ];
            return allFilters.join(' and ');
        };

        const fullFilterDescription = formatFiltersForPrompt(filters.tenures, filters.propertyTypes);

        const prompt = `
            Provide a concise performance summary based on the following data for Singapore's District 16 landed property transactions.
            The user has filtered the data for the period from ${filters.startDate} to ${filters.endDate}.
            ${fullFilterDescription ? `The analysis should specifically focus on **${fullFilterDescription}** properties.` : ''}

            Overall Key Metrics for the entire period:
            - Total Transactions: ${kpis.totalTransactions}
            - Total Sales Volume: $${kpis.totalSalesVolume.toLocaleString()}
            - Average Price (PSF): $${Math.round(kpis.averagePricePsf).toLocaleString()}
            - Average Profit: $${Math.round(kpis.averageProfit).toLocaleString()}
            - Highest Transaction: $${kpis.highestTransaction.toLocaleString()}
            
            Based on these overall metrics, provide a short, insightful summary for a property investor.
            ${fullFilterDescription ? `Start your summary by explicitly mentioning the filtered property characteristics in bold, like "For **${fullFilterDescription}** properties in District 16..."` : 'The analysis covers all property types in District 16.'}
            Incorporate quarter-over-quarter trends if available.

            After the summary, create a markdown table that compares key metrics across different timeframes.
            The table columns should be "Metric", "Current vs. Last Month", "Current vs. Last Quarter", and "Current YTD vs. Last Year".
            The table rows should be "Transaction Volume", "Average Price (PSF)", and "Average Profit".
            In each cell, show the comparison as "Current Value vs. Previous Value". Use "N/A" if data for a period is missing.

            ${comparativeDataForPrompt}
            
            Use markdown for simple formatting like bullet points, bold text, and tables. Do not use headers (like ##) or start your response with a header.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setAiSummary(response.text);

        } catch (err) {
            console.error("Error generating AI summary:", err);
            setAiSummaryError("Failed to generate AI summary. Please check your connection or API configuration.");
        } finally {
            setIsAiSummaryLoading(false);
        }
    };

    const handler = setTimeout(() => {
        generateSummary();
    }, 500);

    return () => {
        clearTimeout(handler);
    };

  }, [kpis, filters, quarterlyKpis, comparativeMetrics]);


  const chartData = useMemo(() => {
    const propertyTypeDist: { [key: string]: number } = {};
    filteredData.forEach(d => {
      propertyTypeDist[d.propertyType] = (propertyTypeDist[d.propertyType] || 0) + 1;
    });
    const propertyTypeData = Object.entries(propertyTypeDist).map(([name, value]) => ({ name, value }));

    if (filteredData.length === 0) {
        return { timeSeriesData: [], propertyTypeData };
    }

    const getAggregationKey = (date: Date): string => {
        const year = date.getUTCFullYear();
        switch (timeAggregation) {
            case 'Quarter':
                const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
                return `${year}-Q${quarter}`;
            case 'Year':
                return year.toString();
            case 'Month':
            default:
                const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
                return `${year}-${month}`;
        }
    };

    const aggregates: {
        [key: string]: {
            totalPsf: number;
            count: number;
            totalProfit: number;
            profitCount: number;
            types: { [propertyType: string]: number };
        }
    } = {};

    const dates = filteredData.map(d => d.saleDate.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    let current = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
    const endDateForLoop = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1));

    while (current <= endDateForLoop) {
        const key = getAggregationKey(current);
        if (!aggregates[key]) {
            aggregates[key] = { totalPsf: 0, count: 0, totalProfit: 0, profitCount: 0, types: {} };
            uniquePropertyTypes.forEach(type => {
                aggregates[key].types[type] = 0;
            });
        }
        
        if (timeAggregation === 'Month') {
            current.setUTCMonth(current.getUTCMonth() + 1);
        } else if (timeAggregation === 'Quarter') {
            current.setUTCMonth(current.getUTCMonth() + 3);
        } else { // Year
            current.setUTCFullYear(current.getUTCFullYear() + 1);
        }
    }

    filteredData.forEach(d => {
        const key = getAggregationKey(d.saleDate);
        if (aggregates[key]) {
            aggregates[key].count++;
            aggregates[key].totalPsf += d.unitPricePsf;
            if (d.profit > 0) {
              aggregates[key].profitCount++;
              aggregates[key].totalProfit += d.profit;
            }
            aggregates[key].types[d.propertyType] = (aggregates[key].types[d.propertyType] || 0) + 1;
        }
    });

    const timeSeriesData = Object.entries(aggregates)
        .map(([period, data]) => ({
            period,
            transactions: data.count,
            avgPricePsf: data.count > 0 ? data.totalPsf / data.count : 0,
            avgProfit: data.profitCount > 0 ? data.totalProfit / data.profitCount : 0,
            ...data.types,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

    return { timeSeriesData, propertyTypeData };
  }, [filteredData, uniquePropertyTypes, timeAggregation]);

  const updateTimeAggregation = useCallback((agg: 'Month' | 'Quarter' | 'Year') => {
    setTimeAggregation(agg);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({...prev, ...newFilters}));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters({
      ...initialDateRange,
      propertyTypes: [],
      tenures: [],
      streetName: [],
    });
  }, [initialDateRange]);

  return {
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    filteredData,
    kpis,
    quarterlyKpis,
    chartData,
    uniquePropertyTypes,
    uniqueTenures,
    uniqueStreetNames,
    timeAggregation,
    updateTimeAggregation,
    aiSummary,
    isAiSummaryLoading,
    aiSummaryError,
  };
};