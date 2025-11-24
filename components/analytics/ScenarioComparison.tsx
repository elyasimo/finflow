import { useState, useEffect, useRef } from "react";
import { Select } from "@/components/ui/select";
import { TradeMetrics as BaseTradeMetrics } from "@/types/analytics";
import { EquityCurveChart } from "@/components/analytics/equity-curve-chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Initialize the plugin
(jsPDF as any).API.autoTable = autoTable;

interface BacktestMeta {
  id: string;
  strategyName: string;
  date: string;
  params?: Record<string, any>;
}

// Extend the base TradeMetrics type
interface TradeMetrics extends BaseTradeMetrics {
  strategyName?: string;
}

export default function ScenarioComparison() {
  const [available, setAvailable] = useState<BacktestMeta[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<TradeMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch available backtests
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/backtest/list`)
      .then(res => res.json())
      .then(setAvailable);
  }, []);

  // Fetch results for selected backtests
  useEffect(() => {
    if (selected.length === 0) return;
    setLoading(true);
    Promise.all(selected.map(id =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/backtest/${id}`).then(res => res.json())
    )).then(setResults).finally(() => setLoading(false));
  }, [selected]);

  // Handle select change (convert event to string[])
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(o => o.value);
    setSelected(options);
  };

  // Export as CSV
  const exportCSV = () => {
    if (!results.length) return;
    const metricKeys = [
      "totalProfitLoss", "winRate", "sharpeRatio", "maxDrawdown", "profitFactor", "expectancy", "averageWin", "averageLoss", "largestWin", "largestLoss"
    ];
    const metricLabels: Record<string, string> = {
      totalProfitLoss: "Total P&L",
      winRate: "Win Rate",
      sharpeRatio: "Sharpe Ratio",
      maxDrawdown: "Max Drawdown",
      profitFactor: "Profit Factor",
      expectancy: "Expectancy",
      averageWin: "Average Win",
      averageLoss: "Average Loss",
      largestWin: "Largest Win",
      largestLoss: "Largest Loss"
    };
    let csv = 'Metric,' + results.map((_, i) => available.find(a => a.id === selected[i])?.strategyName || `Scenario ${i + 1}`).join(',') + '\n';
    for (const key of metricKeys) {
      csv += metricLabels[key] + ',' + results.map(r => (r as any)[key] != null && typeof (r as any)[key] === 'number' && !isNaN((r as any)[key]) ? (r as any)[key].toFixed(2) : (r as any)[key] ?? '-').join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strategy_comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as PDF
  const exportPDF = async () => {
    if (!results.length) return;
    const doc = new jsPDF();
    const metricKeys = [
      "totalProfitLoss", "winRate", "sharpeRatio", "maxDrawdown", "profitFactor", "expectancy", "averageWin", "averageLoss", "largestWin", "largestLoss"
    ];
    const metricLabels: Record<string, string> = {
      totalProfitLoss: "Total P/L",
      winRate: "Win Rate",
      sharpeRatio: "Sharpe Ratio",
      maxDrawdown: "Max Drawdown",
      profitFactor: "Profit Factor",
      expectancy: "Expectancy",
      averageWin: "Avg Win",
      averageLoss: "Avg Loss",
      largestWin: "Largest Win",
      largestLoss: "Largest Loss"
    };

    // Add title
    doc.setFontSize(16);
    doc.text('Strategy Comparison Report', 14, 15);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    // Add chart image
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth() - 28;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 14, 28, pdfWidth, pdfHeight);
      // Move table below chart
      doc.setPage(1);
      doc.setFontSize(10);
      autoTable(doc, {
        startY: 28 + pdfHeight + 10,
        head: [['Metric', ...results.map(r => r.strategyName || 'Strategy')]],
        body: metricKeys.map(key => [
          metricLabels[key],
          ...results.map(r => (r as any)[key] != null && typeof (r as any)[key] === 'number' && !isNaN((r as any)[key]) ? (r as any)[key].toFixed(2) : (r as any)[key] ?? '-')
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    } else {
      // Fallback: just table
      autoTable(doc, {
        startY: 30,
        head: [['Metric', ...results.map(r => r.strategyName || 'Strategy')]],
        body: metricKeys.map(key => [
          metricLabels[key],
          ...results.map(r => (r as any)[key] != null && typeof (r as any)[key] === 'number' && !isNaN((r as any)[key]) ? (r as any)[key].toFixed(2) : (r as any)[key] ?? '-')
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    }
    doc.save('strategy-comparison.pdf');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Scenario Comparison</h2>
      <select multiple value={selected} onChange={handleSelectChange} className="mb-4 border rounded p-2 w-full">
        {available.map(bt => (
          <option key={bt.id} value={bt.id}>
            {bt.strategyName} ({bt.date})
          </option>
        ))}
      </select>
      {results.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1 bg-blue-500 text-white rounded">Export CSV</button>
          <button onClick={exportPDF} className="px-3 py-1 bg-green-600 text-white rounded">Export PDF</button>
        </div>
      )}
      {loading && <div>Loading results...</div>}
      {!loading && results.length > 0 && (
        <div className="space-y-8">
          <div ref={chartRef}>
            <MultiEquityCurveChart results={results} available={available} selected={selected} />
          </div>
          <MetricsComparisonTable results={results} available={available} selected={selected} />
        </div>
      )}
    </div>
  );
}

// Multi-equity-curve chart for scenario comparison
function MultiEquityCurveChart({ results, available, selected }: { results: TradeMetrics[]; available: BacktestMeta[]; selected: string[] }) {
  // Prepare data for multi-line chart
  // Find the max length of all equity curves
  const maxLen = Math.max(...results.map(r => r.equityCurve.length));
  // Build a merged array by time
  const merged: any[] = [];
  for (let i = 0; i < maxLen; i++) {
    const row: any = {};
    // Use the time from the first available equity curve at this index
    row.time = results[0]?.equityCurve[i]?.time || null;
    results.forEach((r, idx) => {
      row[`equity${idx}`] = r.equityCurve[i]?.equity ?? null;
    });
    merged.push(row);
  }
  // Assign colors
  const colors = ['#8884d8', '#82ca9d', '#ff7300', '#d62728', '#2ca02c', '#9467bd', '#8c564b'];
  return (
    <div>
      <h3 className="font-semibold mb-2">Equity Curve Comparison</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={t => t ? new Date(t).toLocaleDateString() : ''} />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip labelFormatter={t => t ? new Date(t).toLocaleString() : ''} />
            <Legend />
            {results.map((r, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`equity${idx}`}
                stroke={colors[idx % colors.length]}
                dot={false}
                name={available.find(a => a.id === selected[idx])?.strategyName || `Scenario ${idx + 1}`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Metrics comparison table for scenario comparison
function MetricsComparisonTable({ results, available, selected }: { results: TradeMetrics[]; available: BacktestMeta[]; selected: string[] }) {
  const metricKeys = [
    "totalProfitLoss", "winRate", "sharpeRatio", "maxDrawdown", "profitFactor", "expectancy", "averageWin", "averageLoss", "largestWin", "largestLoss"
  ] as const;
  const metricLabels: Record<typeof metricKeys[number], string> = {
    totalProfitLoss: "Total P&L",
    winRate: "Win Rate",
    sharpeRatio: "Sharpe Ratio",
    maxDrawdown: "Max Drawdown",
    profitFactor: "Profit Factor",
    expectancy: "Expectancy",
    averageWin: "Average Win",
    averageLoss: "Average Loss",
    largestWin: "Largest Win",
    largestLoss: "Largest Loss"
  };
  return (
    <div>
      <h3 className="font-semibold mb-2">Metrics Comparison</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Metric</th>
              {results.map((_, i) => (
                <th key={i} className="p-2 border">{available.find(a => a.id === selected[i])?.strategyName || `Scenario ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricKeys.map(key => (
              <tr key={key}>
                <td className="p-2 border font-medium">{metricLabels[key]}</td>
                {results.map((r, i) => (
                  <td key={i} className="p-2 border text-right">{(r as any)[key] != null && typeof (r as any)[key] === 'number' && !isNaN((r as any)[key]) ? (r as any)[key].toFixed(2) : (r as any)[key] ?? '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 