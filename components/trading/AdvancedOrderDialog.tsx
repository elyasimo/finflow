'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, Target, Shield, Repeat } from 'lucide-react';
import { useCurrency } from '@/components/finflow/CurrencyContext';

interface AdvancedOrderDialogProps {
  symbol: string;
  currentPrice?: number;
  onOrderPlaced?: () => void;
}

export function AdvancedOrderDialog({ symbol, currentPrice, onOrderPlaced }: AdvancedOrderDialogProps) {
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop-loss' | 'take-profit' | 'oco'>('market');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [stopLimitPrice, setStopLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const placeOrder = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      const body: any = {
        symbol,
        side,
        quantity: parseFloat(quantity),
      };

      switch (orderType) {
        case 'market':
          endpoint = '/orders/market';
          break;
        case 'limit':
          endpoint = '/orders/limit';
          body.price = parseFloat(price);
          body.timeInForce = 'GTC';
          break;
        case 'stop-loss':
          endpoint = '/orders/stop-loss';
          body.stopPrice = parseFloat(stopPrice);
          break;
        case 'take-profit':
          endpoint = '/orders/take-profit';
          body.stopPrice = parseFloat(stopPrice);
          break;
        case 'oco':
          endpoint = '/orders/oco';
          body.price = parseFloat(price);
          body.stopPrice = parseFloat(stopPrice);
          if (stopLimitPrice) {
            body.stopLimitPrice = parseFloat(stopLimitPrice);
          }
          break;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place order');
      }

      const result = await response.json();
      setSuccess(`Order placed successfully! Order ID: ${result.orderId || result.orderListId}`);

      // Reset form
      setQuantity('');
      setPrice('');
      setStopPrice('');
      setStopLimitPrice('');

      if (onOrderPlaced) {
        onOrderPlaced();
      }

      // Close dialog after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const estimatedValue = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0';
  const estimatedMarketValue = quantity && currentPrice ? (parseFloat(quantity) * currentPrice).toFixed(2) : '0';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Advanced Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Place Advanced Order - {symbol}</DialogTitle>
          <DialogDescription>
            Choose order type and configure your trade parameters
          </DialogDescription>
        </DialogHeader>

        <Tabs value={orderType} onValueChange={(v: any) => setOrderType(v)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
            <TabsTrigger value="stop-loss">Stop Loss</TabsTrigger>
            <TabsTrigger value="take-profit">Take Profit</TabsTrigger>
            <TabsTrigger value="oco">OCO</TabsTrigger>
          </TabsList>

          {/* Market Order */}
          <TabsContent value="market" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Market Order:</strong> Executes immediately at current market price. Fastest execution but price not guaranteed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Side</Label>
                <Select value={side} onValueChange={(v: any) => setSide(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Buy
                      </div>
                    </SelectItem>
                    <SelectItem value="SELL">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        Sell
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                />
              </div>
            </div>

            {currentPrice && quantity && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex justify-between text-sm">
                  <span>Current Price:</span>
                  <span className="font-semibold">{currentPrice.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Estimated Value:</span>
                  <span className="font-semibold">{estimatedMarketValue} {currency}</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Limit Order */}
          <TabsContent value="limit" className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Limit Order:</strong> Executes only at your specified price or better. Order may not fill if price not reached.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Side</Label>
                <Select value={side} onValueChange={(v: any) => setSide(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                />
              </div>

              <div className="col-span-2">
                <Label>Limit Price ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter limit price"
                />
              </div>
            </div>

            {quantity && price && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex justify-between text-sm">
                  <span>Order Value:</span>
                  <span className="font-semibold">{estimatedValue} {currency}</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Stop-Loss Order */}
          <TabsContent value="stop-loss" className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Stop-Loss Order:</strong> Automatically sells when price drops to your stop price, limiting losses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                />
              </div>

              <div>
                <Label>Stop Price ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="Trigger price"
                />
              </div>
            </div>

            {currentPrice && stopPrice && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="flex justify-between text-sm">
                  <span>Current Price:</span>
                  <span>{currentPrice.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Stop Price:</span>
                  <span className="font-semibold text-red-600">{stopPrice} {currency}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Loss if Triggered:</span>
                  <span className="font-semibold text-red-600">
                    {((parseFloat(stopPrice) - currentPrice) / currentPrice * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Take-Profit Order */}
          <TabsContent value="take-profit" className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Take-Profit Order:</strong> Automatically sells when price rises to your target, securing profits.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                />
              </div>

              <div>
                <Label>Target Price ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="Target price"
                />
              </div>
            </div>

            {currentPrice && stopPrice && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="flex justify-between text-sm">
                  <span>Current Price:</span>
                  <span>{currentPrice.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Target Price:</span>
                  <span className="font-semibold text-green-600">{stopPrice} {currency}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Gain if Triggered:</span>
                  <span className="font-semibold text-green-600">
                    +{((parseFloat(stopPrice) - currentPrice) / currentPrice * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* OCO Order */}
          <TabsContent value="oco" className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>OCO (One-Cancels-Other):</strong> Combines take-profit and stop-loss. When one triggers, the other is automatically cancelled.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                />
              </div>

              <div>
                <Label>Take-Profit Price ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Target price"
                />
              </div>

              <div>
                <Label>Stop-Loss Price ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="Stop price"
                />
              </div>
            </div>

            {currentPrice && price && stopPrice && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Price:</span>
                  <span className="font-semibold">{currentPrice.toFixed(2)} {currency}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Take-Profit:</span>
                    <span className="font-semibold text-green-600">
                      {price} {currency} (+{((parseFloat(price) - currentPrice) / currentPrice * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-red-600">Stop-Loss:</span>
                    <span className="font-semibold text-red-600">
                      {stopPrice} {currency} ({((parseFloat(stopPrice) - currentPrice) / currentPrice * 100).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={placeOrder}
            disabled={loading || !quantity || (orderType !== 'market' && (!price && !stopPrice))}
            className="flex-1"
          >
            {loading ? 'Placing Order...' : `Place ${orderType.toUpperCase()} Order`}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
