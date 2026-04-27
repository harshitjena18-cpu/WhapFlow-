import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, CheckCircle2, Clock, BarChart3, LucideIcon } from 'lucide-react';
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
  trendType: 'up' | 'down';
  trendLabel: string;
  isGood?: boolean;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

const StatCard = memo(({ title, value, trend, trendType, trendLabel, isGood = true, icon: Icon, iconColor, iconBg }: StatCardProps) => {
  const isPositiveTrend = trendType === 'up';
  const isSuccess = isGood ? isPositiveTrend : !isPositiveTrend;

  return (
    <div
      role="region"
      aria-label={`${title}: ${value}. ${isPositiveTrend ? 'Up' : 'Down'} ${trend} ${trendLabel}`}
      className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        <span className={`flex items-center gap-0.5 font-bold ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositiveTrend ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
          <span className="sr-only">{isPositiveTrend ? 'Increase of' : 'Decrease of'}</span>
          {trend}
        </span>
        <span className="text-gray-500">{trendLabel}</span>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";

export function AnalyticsView() {
  return (
    <div className="space-y-10">
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-2">Deep dive into your cart recovery performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Conversions"
          value="227"
          trend="12.5%"
          trendType="up"
          trendLabel="from last week"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Avg. Recovery Time"
          value="2.4h"
          trend="18%"
          trendType="down"
          trendLabel="faster"
          isGood={false}
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Message Open Rate"
          value="87.3%"
          trend="5.2%"
          trendType="up"
          trendLabel="improvement"
          icon={BarChart3}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Daily Conversions</h2>
          <p className="text-sm text-gray-500 mb-8">Last 7 days</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                />
                <Bar dataKey="conversions" fill="#25D366" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Channel Distribution</h2>
          <p className="text-sm text-gray-500 mb-8">Message delivery by channel</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} fill="#8884d8" dataKey="value" style={{ fontSize: '13px', fontWeight: 500 }}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
