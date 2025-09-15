import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, Filters } from '../types';
import { fetchPropertyData } from '../services/propertyDataService';

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

  const kpis = useMemo(() => {
    const count = filteredData.length;
    if (count === 0) {
      return {
        totalTransactions: 0,
        totalSalesVolume: 0,
        averagePricePsf: 0,
        medianPricePsf: 0,
        highestTransaction: 0,
      };
    }

    const totalSalesVolume = filteredData.reduce((sum, d) => sum + d.transactedPrice, 0);
    const averagePricePsf = filteredData.reduce((sum, d) => sum + d.unitPricePsf, 0) / count;
    
    const sortedPricesPsf = [...filteredData].map(d => d.unitPricePsf).sort((a, b) => a - b);
    const mid = Math.floor(sortedPricesPsf.length / 2);
    const medianPricePsf = sortedPricesPsf.length % 2 === 0
      ? (sortedPricesPsf[mid - 1] + sortedPricesPsf[mid]) / 2
      : sortedPricesPsf[mid];
      
    const highestTransaction = Math.max(...filteredData.map(d => d.transactedPrice));

    return {
      totalTransactions: count,
      totalSalesVolume,
      averagePricePsf,
      medianPricePsf,
      highestTransaction,
    };
  }, [filteredData]);

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
            aggregates[key] = { totalPsf: 0, count: 0, types: {} };
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
            aggregates[key].types[d.propertyType] = (aggregates[key].types[d.propertyType] || 0) + 1;
        }
    });

    const timeSeriesData = Object.entries(aggregates)
        .map(([period, data]) => ({
            period,
            transactions: data.count,
            avgPricePsf: data.count > 0 ? data.totalPsf / data.count : 0,
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
    chartData,
    uniquePropertyTypes,
    uniqueTenures,
    uniqueStreetNames,
    timeAggregation,
    updateTimeAggregation,
  };
};
