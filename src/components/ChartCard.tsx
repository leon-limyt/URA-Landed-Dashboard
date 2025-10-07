import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerControls?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = "", headerControls }) => {
  return (
    <div className={`bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {headerControls && <div>{headerControls}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default ChartCard;