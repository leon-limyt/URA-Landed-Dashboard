
import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div>{children}</div>
    </div>
  );
};

export default ChartCard;
