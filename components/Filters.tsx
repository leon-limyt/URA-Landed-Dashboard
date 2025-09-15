import React from 'react';
import { Filters as FiltersType } from '../types';
import MultiSelectDropdown from './MultiSelectDropdown';

interface FiltersProps {
  filters: FiltersType;
  updateFilters: (newFilters: Partial<FiltersType>) => void;
  resetFilters: () => void;
  propertyTypes: string[];
  tenures: string[];
  streetNames: string[];
}

const FilterInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full bg-slate-700 text-white rounded-md border border-slate-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
);

const Filters: React.FC<FiltersProps> = ({ filters, updateFilters, resetFilters, propertyTypes, tenures, streetNames }) => {

    const handleMultiSelectChange = (key: 'propertyTypes' | 'tenures' | 'streetName', values: string[]) => {
        updateFilters({ [key]: values });
    };

    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        if (!value) {
            updateFilters({ [field]: '' });
            return;
        }

        if (field === 'startDate') {
            updateFilters({ startDate: `${value}-01` });
        } else {
            const [year, month] = value.split('-').map(Number);
            // new Date(year, month, 0) gives the last day of the selected month
            // because the month in the Date constructor is 0-indexed.
            const lastDay = new Date(year, month, 0).getDate();
            const formattedLastDay = String(lastDay).padStart(2, '0');
            updateFilters({ endDate: `${value}-${formattedLastDay}` });
        }
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                    <FilterInput 
                        type="month" 
                        value={filters.startDate ? filters.startDate.slice(0, 7) : ''} 
                        onChange={e => handleDateChange('startDate', e.target.value)} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
                    <FilterInput 
                        type="month" 
                        value={filters.endDate ? filters.endDate.slice(0, 7) : ''} 
                        onChange={e => handleDateChange('endDate', e.target.value)} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Property Type</label>
                    <MultiSelectDropdown
                        options={propertyTypes}
                        selectedValues={filters.propertyTypes}
                        onChange={(values) => handleMultiSelectChange('propertyTypes', values)}
                        placeholder="Select Property Types"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Tenure</label>
                     <MultiSelectDropdown
                        options={tenures}
                        selectedValues={filters.tenures}
                        onChange={(values) => handleMultiSelectChange('tenures', values)}
                        placeholder="Select Tenures"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Street Name</label>
                    <MultiSelectDropdown
                        options={streetNames}
                        selectedValues={filters.streetName}
                        onChange={(values) => handleMultiSelectChange('streetName', values)}
                        placeholder="Select Street Names"
                        searchable={true}
                    />
                </div>
            </div>
            <div className="flex justify-end">
                 <button 
                    onClick={resetFilters}
                    className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                    aria-label="Reset all filters"
                 >
                    Reset Filters
                </button>
            </div>
        </div>
    );
};

export default Filters;