
import React from 'react';
import { usePropertyData } from '../hooks/usePropertyData';
import KpiCard from './KpiCard';
import Filters from './Filters';
import ChartCard from './ChartCard';
import TransactionsTable from './TransactionsTable';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-sky-500"></div>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);

const Dashboard: React.FC = () => {
    const {
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
        uniqueStreetNames
    } = usePropertyData();

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} />;
    
    const PIE_COLORS = ['#0ea5e9', '#6366f1', '#ec4899', '#f97316', '#10b981', '#f59e0b'];
    
    // Style for the tooltip container
    const tooltipContentStyle = { 
        backgroundColor: '#1e293b', 
        border: '1px solid #334155',
    };
    
    // Style for the text inside the tooltip
    const tooltipTextStyle = {
        color: '#e2e8f0'
    };

    return (
        <div className="space-y-8">
            <Filters
                filters={filters}
                updateFilters={updateFilters}
                resetFilters={resetFilters}
                propertyTypes={uniquePropertyTypes}
                tenures={uniqueTenures}
                streetNames={uniqueStreetNames}
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <KpiCard title="Total Transactions" value={kpis.totalTransactions.toLocaleString()} />
                <KpiCard title="Total Sales Volume" value={`$${(kpis.totalSalesVolume / 1_000_000).toFixed(2)}M`} />
                <KpiCard title="Average Price ($ PSF)" value={`$${Math.round(kpis.averagePricePsf).toLocaleString()}`} />
                <KpiCard title="Median Price ($ PSF)" value={`$${Math.round(kpis.medianPricePsf).toLocaleString()}`} />
                <KpiCard title="Highest Transaction" value={`$${(kpis.highestTransaction / 1_000_000).toFixed(2)}M`} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Transaction Volume Over Time" className="lg:col-span-2">
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipTextStyle} labelStyle={tooltipTextStyle} />
                            <Legend />
                            <Line type="monotone" dataKey="transactions" name="Transactions" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Property Type Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={chartData.propertyTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {chartData.propertyTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipTextStyle} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                 <ChartCard title="Average Price ($ PSF) Over Time" className="lg:col-span-3">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis
                                stroke="#94a3b8"
                                yAxisId="left"
                                orientation="left"
                                tickFormatter={(value) => Math.round(value as number).toLocaleString()}
                             />
                            <Tooltip
                                contentStyle={tooltipContentStyle}
                                itemStyle={tooltipTextStyle}
                                labelStyle={tooltipTextStyle}
                                formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                            />
                            <Legend />
                             <Bar yAxisId="left" dataKey="avgPricePsf" name="Avg Price ($ PSF)" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Data Table */}
            <TransactionsTable data={filteredData} />
        </div>
    );
};

export default Dashboard;
