// @ts-nocheck
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import dynamic from 'next/dynamic';

const HeatMapGrid = dynamic(() => import('react-heatmap-grid'), { ssr: false });

const defaultConfig = {
  symbol: 'BTCUSDT',
  investment: 1000,
  stopLossPercentage: 2,
  takeProfitPercentage: 4,
};

const strategies = [
  { value: 'ma-crossover', label: 'MA Crossover' },
  // Add more strategies as needed
];

const metrics = [
  { value: 'sharpeRatio', label: 'Sharpe Ratio' },
  { value: 'totalProfitLoss', label: 'Total Profit/Loss' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'maxDrawdown', label: 'Max Drawdown' },
];

function exportToCSV(results: unknown[], metric: string) {
  if (!results.length) return;
  const header = ['Short Window', 'Long Window', metric];
  const rows = results.map(r => [r.config.shortWindow, r.config.longWindow, r.metrics[metric]]);
  const csv = [header, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'optimization_results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function OptimizationPanel() {
  const [strategy, setStrategy] = useState(strategies[0].value);
  const [paramRanges, setParamRanges] = useState({
    shortWindow: '5,10,15',
    longWindow: '20,30,50',
  });
  const [metric, setMetric] = useState(metrics[0].value);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const paramRangesParsed: Record<string, number[]> = {};
      Object.entries(paramRanges).forEach(([k, v]) => {
        paramRangesParsed[k] = v.split(',').map(Number).filter(x => !isNaN(x));
      });
      const body = {
        strategy,
        paramRanges: paramRangesParsed,
        config: defaultConfig,
        startTime: new Date(startTime).getTime(),
        endTime: new Date(endTime).getTime(),
        metric,
        maxResults: 10,
      };
      const res = await fetch('/api/ai-trader/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to optimize');
      setResults(await res.json());
    } catch (e: unknown) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const best = results.length > 0 ? results[0] : null;
  const chartData = results.map((r, i) => ({
    name: `${r.config.shortWindow}/${r.config.longWindow}`,
    value: typeof r.metrics[metric] === 'number' ? r.metrics[metric] : 0,
  }));

  // --- Heatmap Data Preparation ---
  let shortWindows: number[] = [];
  let longWindows: number[] = [];
  let heatmapData: (number | null)[][] = [];
  if (results.length > 0) {
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
      <h2 className="text-xl font-bold mb-4">Parameter Optimization</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label>Strategy</label>
          <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full border rounded px-2 py-1">
            {strategies.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label>Metric</label>
          <select value={metric} onChange={e => setMetric(e.target.value)} className="w-full border rounded px-2 py-1">
            {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label>Short Window (comma-separated)</label>
          <input type="text" value={paramRanges.shortWindow} onChange={e => setParamRanges(pr => ({ ...pr, shortWindow: e.target.value }))} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label>Long Window (comma-separated)</label>
          <input type="text" value={paramRanges.longWindow} onChange={e => setParamRanges(pr => ({ ...pr, longWindow: e.target.value }))} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label>Start Time</label>
          <input type="date" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label>End Time</label>
          <input type="date" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <button onClick={handleOptimize} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Optimizing...' : 'Run Optimization'}
      </button>
      {results.length > 0 && (
        <>
          <button onClick={() => exportToCSV(results, metric)} className="ml-4 bg-green-600 text-white px-4 py-2 rounded">Export CSV</button>
          <div className="mt-4">
            <h3 className="font-semibold">Best Parameter Set</h3>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-2">
              Short Window: <b>{best.config.shortWindow}</b>, Long Window: <b>{best.config.longWindow}</b>, {metrics.find(m => m.value === metric)?.label}: <b>{typeof best.metrics[metric] === 'number' ? best.metrics[metric].toFixed(4) : best.metrics[metric]}</b>
            </div>
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
              <h3 className="font-semibold mb-2">Heatmap: {metrics.find(m => m.value === metric)?.label}</h3>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                {typeof window !== 'undefined' && (
                  <HeatMapGrid
                    data={heatmapData}
                    xLabels={shortWindows.map(String)}
                    yLabels={longWindows.map(String)}
                    cellRender={(x: number, y: number, value: number | null) => value != null ? value.toFixed(2) : ''}
                    cellStyle={(_x: number, _y: number, value: number | null) => ({
                      background: value == null ? '#eee' : `rgba(37,99,235,${0.2 + 0.8 * ((value - Math.min(...chartData.map(d => d.value))) / (Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value)) || 1))})`,
                      color: value != null && value > 0.5 * Math.max(...chartData.map(d => d.value)) ? '#fff' : '#222',
                    })}
                    xLabelsStyle={() => ({ fontSize: '12px' })}
                    yLabelsStyle={() => ({ fontSize: '12px' })}
                    square
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Short Window</th>
                <th className="border px-2 py-1">Long Window</th>
                <th className="border px-2 py-1">{metrics.find(m => m.value === metric)?.label}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{r.config.shortWindow}</td>
                  <td className="border px-2 py-1">{r.config.longWindow}</td>
                  <td className="border px-2 py-1">{typeof r.metrics[metric] === 'number' ? r.metrics[metric].toFixed(4) : r.metrics[metric]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 