import React, { useMemo } from 'react';
import { usePropertyData } from '../hooks/usePropertyData';
import KpiCard from './KpiCard';
import Filters from './Filters';
import ChartCard from './ChartCard';
import TransactionsTable from './TransactionsTable';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Bar, LineChart, Line } from 'recharts';

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
        uniqueStreetNames,
        timeAggregation,
        updateTimeAggregation
    } = usePropertyData();

    const COLORS = ['#ec4899', '#6366f1', '#0ea5e9', '#f97316', '#10b981', '#f59e0b'];

    const propertyTypeColorMap = useMemo(() => {
        const map: { [key: string]: string } = {};
        uniquePropertyTypes.forEach((type, index) => {
            map[type] = COLORS[index % COLORS.length];
        });
        return map;
    }, [uniquePropertyTypes]);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} />;
    
    // Style for the tooltip container
    const tooltipContentStyle = { 
        backgroundColor: '#1e293b', 
        border: '1px solid #334155',
    };
    
    // Style for the text inside the tooltip
    const tooltipTextStyle = {
        color: '#e2e8f0'
    };

    const TimeAggregationControls = (
        <div className="flex items-center space-x-1 bg-slate-700 rounded-lg p-1">
            {(['Month', 'Quarter', 'Year'] as const).map((period) => (
                <button
                    key={period}
                    onClick={() => updateTimeAggregation(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        timeAggregation === period 
                            ? 'bg-sky-500 text-white' 
                            : 'text-slate-300 hover:bg-slate-600'
                    }`}
                    aria-pressed={timeAggregation === period}
                >
                    {period}
                </button>
            ))}
        </div>
    );

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
                <ChartCard title="Transaction Volume by Property Type" className="lg:col-span-2">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="period" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipTextStyle} labelStyle={tooltipTextStyle} />
                            <Legend />
                            {uniquePropertyTypes.map((type) => (
                                <Bar 
                                    key={type} 
                                    dataKey={type} 
                                    stackId="a" 
                                    name={type} 
                                    fill={propertyTypeColorMap[type]} 
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Property Type Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={chartData.propertyTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false}>
                                {chartData.propertyTypeData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={propertyTypeColorMap[entry.name]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipContentStyle} itemStyle={tooltipTextStyle} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                 <ChartCard 
                    title="Average Price ($ PSF) Over Time" 
                    className="lg:col-span-3"
                    headerControls={TimeAggregationControls}
                 >
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="period" stroke="#94a3b8" />
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
                             <Line 
                                yAxisId="left" 
                                type="monotone" 
                                dataKey="avgPricePsf" 
                                name="Avg Price ($ PSF)" 
                                stroke="#6366f1" 
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                             />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Data Table */}
            <TransactionsTable data={filteredData} />
        </div>
    );
};

export default Dashboard;