/**
 * Revenue Chart Component
 * Displays revenue analytics with line/bar charts
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RevenueData {
  date: string;
  amount: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  period?: 'week' | 'month' | 'year';
}

export function RevenueChart({ data, period = 'month' }: RevenueChartProps) {
  const stats = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.amount, 0);
    const avgPerDay = total / (data.length || 1);
    const trend = data.length >= 2 
      ? ((data[data.length - 1].amount - data[0].amount) / data[0].amount) * 100
      : 0;
    
    return { total, avgPerDay, trend };
  }, [data]);

  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold dark:text-white">Revenue Overview</h3>
        <div className="flex items-center gap-2">
          {stats.trend >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(stats.trend).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${stats.total.toFixed(2)}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg/Day</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${stats.avgPerDay.toFixed(2)}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Growth</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end gap-1">
          {data.map((item, index) => {
            const height = (item.amount / maxAmount) * 100;
            return (
              <div
                key={index}
                className="flex-1 group relative"
              >
                <div
                  className="bg-primary-500 dark:bg-primary-600 rounded-t hover:bg-primary-600 dark:hover:bg-primary-500 transition-all cursor-pointer"
                  style={{ height: `${height}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <div className="font-semibold">${item.amount.toFixed(2)}</div>
                      <div className="text-gray-400">{item.orders} orders</div>
                      <div className="text-gray-400">{new Date(item.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -ml-12">
          <span>${maxAmount.toFixed(0)}</span>
          <span>${(maxAmount * 0.75).toFixed(0)}</span>
          <span>${(maxAmount * 0.5).toFixed(0)}</span>
          <span>${(maxAmount * 0.25).toFixed(0)}</span>
          <span>$0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
        {data.map((item, index) => {
          // Show every nth label based on data length
          const showEvery = Math.ceil(data.length / 7);
          if (index % showEvery !== 0 && index !== data.length - 1) return null;
          
          return (
            <span key={index}>
              {new Date(item.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          );
        })}
      </div>
    </div>
  );
}
