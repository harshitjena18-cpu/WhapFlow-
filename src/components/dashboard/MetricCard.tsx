import { DollarSign, Send, TrendingUp, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import { Metric } from '../../types';

const iconMap = {
  DollarSign,
  Send,
  TrendingUp,
  ShoppingCart,
};

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = iconMap[metric.icon as keyof typeof iconMap];
  const isPositive = metric.trend === 'up';

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-8 hover:border-gray-200 transition-all duration-300 group"
      role="article"
      aria-label={`${metric.title}: ${metric.value}`}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="w-11 h-11 bg-[#25D366]/10 rounded-xl flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
          <Icon className="w-5 h-5 text-[#25D366]" aria-hidden="true" />
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            isPositive
              ? 'bg-[#25D366]/10 text-[#25D366]'
              : 'bg-gray-50 text-gray-700'
          }`}
        >
          {isPositive ? (
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>{metric.change}</span>
        </div>
      </div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{metric.title}</h3>
      <p className="text-4xl font-semibold text-gray-900 tracking-tight">{metric.value}</p>
    </div>
  );
}