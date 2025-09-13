
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-sky-500 transition-colors duration-300">
      <h3 className="text-sm font-medium text-slate-400 truncate">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
};

export default KpiCard;
