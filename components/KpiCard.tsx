import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number | null;
}

const TrendIndicator: React.FC<{ value: number }> = ({ value }) => {
    const isPositive = value >= 0;
    const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
    // A path that looks like a simple upward trend line.
    const path = 'M3 17l6-6 4 4 8-8'; 

    return (
        <p className="mt-2 text-sm flex items-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 mr-1 ${!isPositive ? 'transform scale-y-[-1]' : ''}`} // Flip vertically for negative trend
                fill="none"
                viewBox="0 0 24 24"
                stroke={isPositive ? '#4ade80' /* green-400 */ : '#f87171' /* red-400 */}
                strokeWidth="2"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d={path} />
            </svg>
            <span className={`${colorClass} font-semibold`}>{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
            <span className="text-slate-400 ml-1">from last month</span>
        </p>
    );
};


const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-sky-500 transition-colors duration-300">
      <h3 className="text-sm font-medium text-slate-400 truncate">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      {trend !== null && trend !== undefined && isFinite(trend) && (
        <TrendIndicator value={trend} />
      )}
    </div>
  );
};

export default KpiCard;
