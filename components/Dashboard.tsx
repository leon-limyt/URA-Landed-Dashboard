import React, { useMemo, useState, useRef, useEffect } from 'react';
import { usePropertyData } from '../hooks/usePropertyData';
import KpiCard from './KpiCard';
import Filters from './Filters';
import ChartCard from './ChartCard';
import TransactionsTable from './TransactionsTable';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Bar, LineChart, Line } from 'recharts';
import AIPerformanceSummary from './AIPerformanceSummary';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Report from './Report';

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
        kpiTrends,
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
    } = usePropertyData();
    
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const COLORS = ['#ec4899', '#6366f1', '#0ea5e9', '#f97316', '#10b981', '#f59e0b'];

    const propertyTypeColorMap = useMemo(() => {
        const map: { [key: string]: string } = {};
        uniquePropertyTypes.forEach((type, index) => {
            map[type] = COLORS[index % COLORS.length];
        });
        return map;
    }, [uniquePropertyTypes]);

    useEffect(() => {
        if (!isGeneratingReport) {
            return;
        }

        const generatePdf = async () => {
            const reportElement = reportRef.current;
            if (!reportElement) {
                alert("Failed to find report content to generate PDF.");
                setIsGeneratingReport(false);
                return;
            }
        
            try {
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4',
                });
        
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 40;
                let yPos = margin;
        
                const addCanvasToPdf = async (element: HTMLElement | null) => {
                    if (!element) return;
        
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        windowWidth: element.scrollWidth,
                        windowHeight: element.scrollHeight,
                    });
        
                    const imgData = canvas.toDataURL('image/png');
                    const contentWidth = pdfWidth - margin * 2;
                    const contentHeight = (canvas.height * contentWidth) / canvas.width;
                    
                    // If the content doesn't fit and it's not the first element, add a new page.
                    if (yPos + contentHeight > pdfHeight - margin && yPos > margin) {
                        pdf.addPage();
                        yPos = margin;
                    }
        
                    pdf.addImage(imgData, 'PNG', margin, yPos, contentWidth, contentHeight);
                    yPos += contentHeight + 20; // Add spacing after each section.
                };
        
                const sectionIds = [
                    '#report-header', 
                    '#report-kpis', 
                    '#report-summary', 
                    '#report-charts-header',
                    '#report-chart-1', 
                    '#report-chart-2',
                ];
        
                for (const id of sectionIds) {
                    const element = reportElement.querySelector<HTMLElement>(id);
                    await addCanvasToPdf(element);
                }
                
                pdf.save(`Singapore_Property_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        
            } catch (e) {
                console.error("Failed to generate PDF:", e);
                alert("An error occurred while generating the PDF. Please try again.");
            } finally {
                setIsGeneratingReport(false);
            }
        };

        // Use a small timeout. This is a pragmatic way to ensure the browser has
        // completed its paint cycle after the state change, making the DOM ready for html2canvas.
        const timer = setTimeout(generatePdf, 100);

        return () => clearTimeout(timer); // Cleanup on unmount or if isGeneratingReport changes again

    }, [isGeneratingReport]);

    const aiSummaryTitle = useMemo(() => {
        const tenureMap: { [key: string]: string } = { 'FH': 'Freehold' };
        
        const expandAndTitleCase = (str: string) => {
            const expanded = tenureMap[str] || str;
            // The original titleCase function ensures consistent capitalization
            return expanded.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        const tenureFilters = filters.tenures.map(expandAndTitleCase);
        const propertyTypeFilters = filters.propertyTypes.map(expandAndTitleCase);
    
        const allFilters = [...tenureFilters, ...propertyTypeFilters];
        
        if (allFilters.length > 0) {
            return `AI Performance Summary for D16 ${allFilters.join(' and ')}`;
        }
        return 'AI Performance Summary';
    }, [filters.tenures, filters.propertyTypes]);


    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorDisplay message={error} />;
    
    const tooltipContentStyle = { 
        backgroundColor: '#1e293b', 
        border: '1px solid #334155',
    };
    
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
                onDownloadReport={() => setIsGeneratingReport(true)}
                isGeneratingReport={isGeneratingReport}
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <KpiCard title="Total Transactions" value={kpis.totalTransactions.toLocaleString()} trend={kpiTrends.totalTransactions} />
                <KpiCard title="Total Sales Volume" value={`$${(kpis.totalSalesVolume / 1_000_000).toFixed(2)}M`} trend={kpiTrends.totalSalesVolume} />
                <KpiCard title="Average Price ($ PSF)" value={`$${Math.round(kpis.averagePricePsf).toLocaleString()}`} trend={kpiTrends.averagePricePsf} />
                <KpiCard title="Average Profit" value={`$${Math.round(kpis.averageProfit).toLocaleString()}`} trend={kpiTrends.averageProfit} />
                <KpiCard title="Highest Transaction" value={`$${(kpis.highestTransaction / 1_000_000).toFixed(2)}M`} trend={kpiTrends.highestTransaction} />
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
                    title="Price vs. Profit Over Time" 
                    className="lg:col-span-3"
                    headerControls={TimeAggregationControls}
                 >
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="period" stroke="#94a3b8" />
                            <YAxis
                                yAxisId="left"
                                stroke="#94a3b8"
                                orientation="left"
                                tickFormatter={(value) => `$${Math.round(value as number / 1000)}k`}
                             />
                             <YAxis
                                yAxisId="right"
                                stroke="#94a3b8"
                                orientation="right"
                                tickFormatter={(value) => `$${Math.round(value as number / 1000)}k`}
                             />
                            <Tooltip
                                contentStyle={tooltipContentStyle}
                                itemStyle={tooltipTextStyle}
                                labelStyle={tooltipTextStyle}
                                formatter={(value: number, name: string) => {
                                    if (name === 'Average Profit') {
                                        return [`$${Math.round(value).toLocaleString()}`, name];
                                    }
                                    return [`$${Math.round(value).toLocaleString()} psf`, 'Avg Price ($ PSF)'];
                                }}
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
                             <Bar 
                                yAxisId="right"
                                dataKey="avgProfit"
                                name="Average Profit"
                                fill="#10b981"
                                barSize={20}
                             />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            
            <AIPerformanceSummary title={aiSummaryTitle} summary={aiSummary} loading={isAiSummaryLoading} error={aiSummaryError} />

            {/* Data Table */}
            <TransactionsTable data={filteredData} />
            
            {/* Hidden component for PDF generation */}
            {isGeneratingReport && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -10, width: '800px' }}>
                     <Report
                        ref={reportRef}
                        filters={filters}
                        kpis={kpis}
                        aiSummary={aiSummary}
                        chartData={chartData}
                        uniquePropertyTypes={uniquePropertyTypes}
                        propertyTypeColorMap={propertyTypeColorMap}
                    />
                </div>
            )}
        </div>
    );
};

export default Dashboard;