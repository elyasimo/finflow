// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import Layout from "@/components/finflow/layout";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  History,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/hooks/use-currency';
import { useExchangeRates } from '@/hooks/use-exchange-rates';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { tradingAgentApi } from '@/lib/api';

interface TradeLog {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  asset: string;
  quantity: string;
  priceAtAction: string;
  totalValueCents: number;
  reason: string;
  orderId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export default function TradingHistoryPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { convertAndFormat } = useExchangeRates();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    loadHistory();
  }, [statusFilter, assetFilter, actionFilter, page]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const filters: any = {
        limit,
        offset: page * limit,
      };

      if (statusFilter !== 'all') filters.status = statusFilter;
      if (assetFilter) filters.asset = assetFilter.toUpperCase();
      if (actionFilter !== 'all') filters.action = actionFilter;

      const data = await tradingAgentApi.getTradingHistory(filters);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error loading trading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Executed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'buy':
        return <Badge className="bg-blue-500">Buy</Badge>;
      case 'sell':
        return <Badge className="bg-purple-500">Sell</Badge>;
      case 'stop_loss':
        return <Badge className="bg-red-500">Stop Loss</Badge>;
      case 'take_profit':
        return <Badge className="bg-green-500">Take Profit</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const exportToCsv = () => {
    const headers = ['Date', 'Agent', 'Asset', 'Action', 'Quantity', 'Price', 'Value', 'Status', 'Reason'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.agentName,
      log.asset,
      log.action,
      log.quantity || '',
      log.priceAtAction || '',
      log.totalValueCents ? (log.totalValueCents / 100).toFixed(2) : '',
      log.status,
      log.reason,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="w-8 h-8" />
              {t('tradingHistory') || 'Trading History'}
            </h1>
            <p className="text-muted-foreground">
              Complete history of all trading activities
            </p>
          </div>
          <Button onClick={exportToCsv} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Executed</div>
              <div className="text-2xl font-bold text-green-500">{stats.executedTrades}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Failed</div>
              <div className="text-2xl font-bold text-red-500">{stats.failedTrades}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Volume</div>
              <div className="text-2xl font-bold">{convertAndFormat(stats.totalVolumeEur, 'EUR', currency)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Profit/Loss</div>
              <div className={`text-2xl font-bold flex items-center ${stats.profitLossEur >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.profitLossEur >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                {convertAndFormat(Math.abs(stats.profitLossEur), 'EUR', currency)}
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Asset</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search asset (e.g. BTC)"
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-[180px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                  <SelectItem value="stop_loss">Stop Loss</SelectItem>
                  <SelectItem value="take_profit">Take Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => { setPage(0); loadHistory(); }}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* Trading History Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No trading history found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell className="font-medium">{log.agentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.asset}</Badge>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="text-right">
                        {log.quantity ? parseFloat(log.quantity).toFixed(6) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.priceAtAction ? convertAndFormat(parseFloat(log.priceAtAction), 'EUR', currency) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {log.totalValueCents ? convertAndFormat(log.totalValueCents / 100, 'EUR', currency) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} trades
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
