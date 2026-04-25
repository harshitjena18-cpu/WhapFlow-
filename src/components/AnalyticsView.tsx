import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Clock, MessageCircle, ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { memo } from 'react';

const conversionData = [
  { name: 'Mon', conversions: 24 },
  { name: 'Tue', conversions: 31 },
  { name: 'Wed', conversions: 28 },
  { name: 'Thu', conversions: 35 },
  { name: 'Fri', conversions: 42 },
  { name: 'Sat', conversions: 38 },
  { name: 'Sun', conversions: 29 },
];

const channelData = [
  { name: 'WhatsApp', value: 65 },
  { name: 'SMS', value: 25 },
  { name: 'Email', value: 10 },
];

const COLORS = ['#25D366', '#6b7280', '#d1d5db'];

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendValue: number;
  icon: LucideIcon;
  isGood?: boolean; // If true, positive trend is green. If false, negative trend is green (e.g. for time/latency)
}

const StatCard = memo(({ title, value, trend, trendValue, icon: Icon, isGood = true }: StatCardProps) => {
  const isPositive = trendValue >= 0;
  // Determine if the trend is "favorable"
  const isFavorable = isGood ? isPositive : !isPositive;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all group" role="region" aria-label={`${title} metric`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-gray-600" aria-hidden="true" />
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isFavorable
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          <span className="sr-only">{isFavorable ? 'Improvement of' : 'Decline of'}</span>
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {trend}
        </div>
      </div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export function AnalyticsView() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-2">
          Deep dive into your cart recovery performance metrics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Conversions"
          value="227"
          trend="12.5%"
          trendValue={12.5}
          icon={Target}
        />
        <StatCard
          title="Avg. Recovery Time"
          value="2.4h"
          trend="18%"
          trendValue={-18}
          icon={Clock}
          isGood={false} // A decrease in recovery time is good
        />
        <StatCard
          title="Message Open Rate"
          value="87.3%"
          trend="5.2%"
          trendValue={5.2}
          icon={MessageCircle}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversions Chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Daily Conversions</h2>
          <p className="text-sm text-gray-500 mb-8">Last 7 days</p>
          <div style={{ width: '100%', height: 288 }}>
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#f3f4f6' }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#f3f4f6' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                />
                <Bar dataKey="conversions" fill="#25D366" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Channel Distribution</h2>
          <p className="text-sm text-gray-500 mb-8">Message delivery by channel</p>
          <div style={{ width: '100%', height: 288 }}>
            <ResponsiveContainer width="100%" height={288}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '12px', fontWeight: 600, fill: '#4b5563' }}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
