// FIX: Import CSSProperties to correctly type the styles object.
import React, { forwardRef, CSSProperties } from 'react';
import { Kpi, Filters } from '../types';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Bar, LineChart, Line } from 'recharts';

interface ReportProps {
  filters: Filters;
  kpis: Kpi;
  aiSummary: string;
  chartData: {
    timeSeriesData: any[];
    propertyTypeData: any[];
  };
  uniquePropertyTypes: string[];
  propertyTypeColorMap: { [key: string]: string };
}

// Using React.forwardRef to pass the ref to the div element
const Report = forwardRef<HTMLDivElement, ReportProps>((props, ref) => {
    const { filters, kpis, aiSummary, chartData, uniquePropertyTypes, propertyTypeColorMap } = props;

    // Report-specific styles
    // FIX: Add explicit type to the styles object to prevent type inference issues with CSS properties like 'borderCollapse' and 'textAlign'.
    const styles: { [key: string]: CSSProperties } = {
        container: {
            width: '800px',
            padding: '40px',
            backgroundColor: 'white',
            color: '#1e293b',
            fontFamily: 'sans-serif',
            fontSize: '12px'
        },
        header: {
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '10px',
            marginBottom: '20px',
        },
        h1: { fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0' },
        h2: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginTop: '30px', marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' },
        kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' },
        kpiCard: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' },
        kpiTitle: { fontSize: '12px', color: '#64748b', marginBottom: '5px' },
        kpiValue: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a' },
        p: { lineHeight: 1.6, color: '#334155' },
        chartContainer: { marginTop: '20px', pageBreakInside: 'avoid' },
    };

    // Remove markdown for plain text display in PDF
    const cleanAiSummary = aiSummary.replace(/\*\*/g, '').replace(/(\n\* )/g, '\n- ');

    return (
        <div ref={ref} style={styles.container}>
            <div id="report-header" style={styles.header}>
                <h1 style={styles.h1}>Singapore Property Performance Report</h1>
                <p style={styles.p}><strong>Date Range:</strong> {filters.startDate} to {filters.endDate || 'Present'}</p>
            </div>
            
            <div id="report-kpis">
                <h2 style={styles.h2}>Key Performance Indicators</h2>
                <div style={styles.kpiGrid}>
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTitle}>Total Transactions</div>
                        <div style={styles.kpiValue}>{kpis.totalTransactions.toLocaleString()}</div>
                    </div>
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTitle}>Total Sales Volume</div>
                        <div style={styles.kpiValue}>${(kpis.totalSalesVolume / 1_000_000).toFixed(2)}M</div>
                    </div>
                     <div style={styles.kpiCard}>
                        <div style={styles.kpiTitle}>Average Price ($ PSF)</div>
                        <div style={styles.kpiValue}>${Math.round(kpis.averagePricePsf).toLocaleString()}</div>
                    </div>
                    <div style={styles.kpiCard}>
                        <div style={styles.kpiTitle}>Average Profit</div>
                        <div style={styles.kpiValue}>${Math.round(kpis.averageProfit).toLocaleString()}</div>
                    </div>
                     <div style={styles.kpiCard}>
                        <div style={styles.kpiTitle}>Highest Transaction</div>
                        <div style={styles.kpiValue}>${(kpis.highestTransaction / 1_000_000).toFixed(2)}M</div>
                    </div>
                </div>
            </div>

            <div id="report-summary">
                <h2 style={styles.h2}>AI Performance Summary</h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    <p style={styles.p}>{cleanAiSummary}</p>
                </div>
            </div>

            <div id="report-charts-header">
                <h2 style={styles.h2}>Charts</h2>
            </div>
            
             <div id="report-chart-1" style={styles.chartContainer}>
                <strong>Transaction Volume by Property Type</strong>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.timeSeriesData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis allowDecimals={false} />
                        <Tooltip isAnimationActive={false} />
                        <Legend />
                        {uniquePropertyTypes.map((type) => (
                            <Bar key={type} dataKey={type} stackId="a" name={type} fill={propertyTypeColorMap[type]} isAnimationActive={false} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
             <div id="report-chart-2" style={styles.chartContainer}>
                <strong>Price vs. Profit Over Time</strong>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.timeSeriesData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis yAxisId="left" tickFormatter={(value) => `$${Math.round(value as number / 1000)}k`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${Math.round(value as number / 1000)}k`} />
                        <Tooltip isAnimationActive={false} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="avgPricePsf" name="Avg Price ($ PSF)" stroke="#6366f1" isAnimationActive={false} />
                        <Bar yAxisId="right" dataKey="avgProfit" name="Average Profit" fill="#10b981" isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

export default Report;