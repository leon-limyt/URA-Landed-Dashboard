
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

type SortKey = keyof Transaction;
type SortOrder = 'asc' | 'desc';

const useSortableData = (items: Transaction[], initialSortKey: SortKey = 'saleDate') => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: initialSortKey, order: 'desc' });

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: SortKey) => {
    let order: SortOrder = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const TransactionsTable: React.FC<{ data: Transaction[] }> = ({ data }) => {
    const { items, requestSort, sortConfig } = useSortableData(data);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * itemsPerPage;
        const lastPageIndex = firstPageIndex + itemsPerPage;
        return items.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, items]);

    const pageCount = Math.ceil(items.length / itemsPerPage);

    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.order === 'asc' ? '↑' : '↓';
    };

    const headers: { key: SortKey, label: string }[] = [
        { key: 'saleDate', label: 'Sale Date' },
        { key: 'streetName', label: 'Street Name' },
        { key: 'propertyType', label: 'Property Type' },
        { key: 'transactedPrice', label: 'Price ($)' },
        { key: 'areaSqft', label: 'Area (SQFT)' },
        { key: 'unitPricePsf', label: 'Price ($ PSF)' },
        { key: 'tenure', label: 'Tenure' },
    ];

    if (data.length === 0) {
        return (
             <div className="bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Transactions</h3>
                <p className="text-slate-400 text-center py-8">No transactions found for the selected filters.</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
            <h3 className="text-lg font-semibold text-white p-5">Transactions</h3>
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-300 uppercase bg-slate-700">
                        <tr>
                            {headers.map(({key, label}) => (
                                <th key={key} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(key)}>
                                    {label} {getSortIndicator(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableData.map((item, index) => (
                            <tr key={index} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-600">
                                <td className="px-6 py-4">{item.originalSaleDate.includes('T') ? item.originalSaleDate.split('T')[0] : item.originalSaleDate}</td>
                                <td className="px-6 py-4">{item.streetName}</td>
                                <td className="px-6 py-4">{item.propertyType}</td>
                                <td className="px-6 py-4 text-white font-medium">${item.transactedPrice.toLocaleString()}</td>
                                <td className="px-6 py-4">{item.areaSqft.toLocaleString()}</td>
                                <td className="px-6 py-4 text-white">${item.unitPricePsf.toLocaleString()}</td>
                                <td className="px-6 py-4">{item.tenure}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4">
                <span className="text-sm text-slate-400">
                    Page {currentPage} of {pageCount}
                </span>
                <div className="inline-flex mt-2 xs:mt-0">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-l hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Prev
                    </button>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))} disabled={currentPage === pageCount} className="px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-r border-0 border-l border-slate-700 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionsTable;