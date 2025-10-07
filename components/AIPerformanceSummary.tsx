import React from 'react';
import ChartCard from './ChartCard';

interface AIPerformanceSummaryProps {
    title: string;
    summary: string;
    loading: boolean;
    error: string | null;
}

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Split text into blocks that could be paragraphs, lists, or tables.
    const blocks = text.split('\n\n');

    return (
        <>
            {blocks.map((block, index) => {
                const trimmedBlock = block.trim();
                
                // Check for table structure
                if (trimmedBlock.includes('|') && trimmedBlock.includes('-')) {
                    const lines = trimmedBlock.split('\n');
                    const headerLine = lines[0];
                    const dividerLine = lines[1];
                    
                    if (headerLine && dividerLine && dividerLine.match(/\|.*-.*\|/)) {
                        const headers = headerLine.split('|').map(h => h.trim()).slice(1, -1);
                        const rows = lines.slice(2).map(rowLine => 
                            rowLine.split('|').map(c => c.trim()).slice(1, -1)
                        );
                        
                        // Check for valid table structure
                        if (headers.length > 0 && rows.every(r => r.length === headers.length)) {
                             return (
                                <div key={index} className="overflow-x-auto">
                                    <table className="w-full my-4 text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-slate-600">
                                                {headers.map((header, hIndex) => (
                                                    <th key={hIndex} className="p-2 font-semibold text-white">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, rIndex) => (
                                                <tr key={rIndex} className="border-b border-slate-700 last:border-b-0">
                                                    {row.map((cell, cIndex) => (
                                                        <td key={cIndex} className="p-2 whitespace-nowrap">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        }
                    }
                }

                // Existing logic for lists and paragraphs
                const lines = block.split('\n').map((line, lineIndex) => {
                    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    if (line.trim().startsWith('* ')) {
                        return <li key={lineIndex} className="ml-4" dangerouslySetInnerHTML={{ __html: line.substring(2) }} />;
                    }
                    return <span key={lineIndex} dangerouslySetInnerHTML={{ __html: line }} />;
                });
                
                const isList = lines.some(line => line.type === 'li');
                if (isList) {
                    return <ul key={index} className="list-disc list-inside space-y-1 my-2">{lines}</ul>;
                }
                return <p key={index}>{lines}</p>;
            })}
        </>
    );
};


const AIPerformanceSummary: React.FC<AIPerformanceSummaryProps> = ({ title, summary, loading, error }) => {
    return (
        <ChartCard title={title}>
            <div className="text-slate-300 min-h-[100px] prose prose-invert prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300">
                {loading && <p>Generating summary...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {!loading && !error && summary && (
                    <MarkdownRenderer text={summary} />
                )}
            </div>
        </ChartCard>
    );
};

export default AIPerformanceSummary;