import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import dynamic from 'next/dynamic';

const HeatMapGrid = dynamic(() => import('react-heatmap-grid'), { ssr: false });

interface OptimizationResult {
  config: {
    shortWindow: number;
    longWindow: number;
  };
  metrics: {
    sharpeRatio: number;
    totalProfitLoss: number;
    winRate: number;
    maxDrawdown: number;
    [key: string]: number;
  };
}

interface OptimizationRun {
  name: string;
  results: OptimizationResult[];
}

// Dummy data for now; will connect to backend later
const dummyRuns: OptimizationRun[] = [
  {
    name: 'Run 1',
    results: [
      { config: { shortWindow: 5, longWindow: 20 }, metrics: { sharpeRatio: 1.2, totalProfitLoss: 100, winRate: 60, maxDrawdown: 5 } },
      { config: { shortWindow: 10, longWindow: 30 }, metrics: { sharpeRatio: 1.5, totalProfitLoss: 120, winRate: 65, maxDrawdown: 4 } },
      { config: { shortWindow: 15, longWindow: 50 }, metrics: { sharpeRatio: 1.1, totalProfitLoss: 90, winRate: 55, maxDrawdown: 6 } },
    ],
  },
  {
    name: 'Run 2',
    results: [
      { config: { shortWindow: 5, longWindow: 20 }, metrics: { sharpeRatio: 1.0, totalProfitLoss: 80, winRate: 58, maxDrawdown: 7 } },
      { config: { shortWindow: 10, longWindow: 30 }, metrics: { sharpeRatio: 1.3, totalProfitLoss: 110, winRate: 62, maxDrawdown: 5 } },
      { config: { shortWindow: 15, longWindow: 50 }, metrics: { sharpeRatio: 1.0, totalProfitLoss: 85, winRate: 53, maxDrawdown: 8 } },
    ],
  },
];

const metrics = [
  { value: 'sharpeRatio', label: 'Sharpe Ratio' },
  { value: 'totalProfitLoss', label: 'Total Profit/Loss' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'maxDrawdown', label: 'Max Drawdown' },
];

function exportComparisonToCSV(runs: OptimizationRun[], metric: string) {
  if (!runs.length) return;
  const header = ['Run', 'Short Window', 'Long Window', metric];
  const rows = runs.flatMap(run => run.results.map(r => [run.name, r.config.shortWindow, r.config.longWindow, r.metrics[metric]]));
  const csv = [header, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'strategy_comparison.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function StrategyComparisonPanel() {
  const [selectedRuns, setSelectedRuns] = useState<OptimizationRun[]>([dummyRuns[0], dummyRuns[1]]);
  const [metric, setMetric] = useState(metrics[0].value);

  // Prepare data for bar chart
  const chartData = selectedRuns.flatMap(run =>
    run.results.map((r: OptimizationResult) => ({
      name: `${run.name} ${r.config.shortWindow}/${r.config.longWindow}`,
      value: typeof r.metrics[metric] === 'number' ? r.metrics[metric] : 0,
    }))
  );

  // Prepare data for heatmap (for first run only, for simplicity)
  let shortWindows: number[] = [];
  let longWindows: number[] = [];
  let heatmapData: (number | null)[][] = [];
  if (selectedRuns.length > 0) {
    const results = selectedRuns[0].results;
    shortWindows = Array.from(new Set(results.map(r => r.config.shortWindow))).sort((a, b) => a - b);
    longWindows = Array.from(new Set(results.map(r => r.config.longWindow))).sort((a, b) => a - b);
    heatmapData = longWindows.map(lw =>
      shortWindows.map(sw => {
        const found = results.find(r => r.config.shortWindow === sw && r.config.longWindow === lw);
        return found ? (typeof found.metrics[metric] === 'number' ? found.metrics[metric] : null) : null;
      })
    );
  }

  return (
    <div className="p-4 border rounded bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-4">Strategy Comparison</h2>
      <div className="mb-4">
        <label>Metric</label>
        <select value={metric} onChange={e => setMetric(e.target.value)} className="ml-2 border rounded px-2 py-1">
          {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <button onClick={() => exportComparisonToCSV(selectedRuns, metric)} className="ml-4 bg-green-600 text-white px-4 py-2 rounded">Export CSV</button>
      </div>
      <div className="mt-4" style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb">
              <LabelList dataKey="value" position="top" formatter={(v: number) => v.toFixed(2)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {heatmapData.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Heatmap (First Run): {metrics.find(m => m.value === metric)?.label}</h3>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <HeatMapGrid
              data={heatmapData}
              xLabels={shortWindows.map(String)}
              yLabels={longWindows.map(String)}
              cellRender={(x: number, y: number, value: number | null) =>
                typeof value === 'number' && isFinite(value) ? value.toFixed(2) : ''
              }
              cellStyle={(_x: number, _y: number, value: number | null) => ({
                background: value == null ? '#eee' : `rgba(37,99,235,${0.2 + 0.8 * ((value - Math.min(...chartData.map(d => d.value))) / (Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value)) || 1))})`,
                color: value != null && value > 0.5 * Math.max(...chartData.map(d => d.value)) ? '#fff' : '#222',
              })}
              xLabelsStyle={() => ({ fontSize: '12px' })}
              yLabelsStyle={() => ({ fontSize: '12px' })}
              square
            />
          </div>
        </div>
      )}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Run</th>
              <th className="border px-2 py-1">Short Window</th>
              <th className="border px-2 py-1">Long Window</th>
              <th className="border px-2 py-1">{metrics.find(m => m.value === metric)?.label}</th>
            </tr>
          </thead>
          <tbody>
            {selectedRuns.flatMap((run, runIdx) =>
              run.results.map((r: OptimizationResult, i: number) => (
                <tr key={run.name + i}>
                  <td className="border px-2 py-1">{run.name}</td>
                  <td className="border px-2 py-1">{r.config.shortWindow}</td>
                  <td className="border px-2 py-1">{r.config.longWindow}</td>
                  <td className="border px-2 py-1">{typeof r.metrics[metric as keyof typeof r.metrics] === 'number' ? r.metrics[metric as keyof typeof r.metrics].toFixed(4) : r.metrics[metric as keyof typeof r.metrics]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 