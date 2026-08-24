import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

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
  trendLabel: string;
  icon: React.ElementType;
  inverse?: boolean;
}

// PERFORMANCE: Memoize StatCard to prevent unnecessary re-renders on parent state updates.
const StatCard = memo(function StatCard({ title, value, trend, trendLabel, icon: Icon, inverse = false }: StatCardProps) {
  const trendIsPositive = trend.startsWith('↑');
  const isEmerald = inverse ? !trendIsPositive : trendIsPositive;
  const displayColor = isEmerald ? 'text-emerald-600' : 'text-red-600';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      role="region"
      aria-label={`${title}: ${value}`}
      className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#25D366]/10 transition-colors">
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#25D366] group-hover:scale-110 transition-all" aria-hidden="true" />
        </div>
      </div>
      <p className="text-4xl font-semibold text-gray-900 tracking-tight">{value}</p>
      <div className={`flex items-center gap-1.5 mt-4 text-sm font-medium ${displayColor}`}>
        <span className="sr-only">{trendIsPositive ? 'Increase of' : 'Decrease of'}</span>
        {trend}
        <span className="text-gray-500 font-normal ml-0.5">{trendLabel}</span>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

export function AnalyticsView() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="pb-2"
      >
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-2">
          Deep dive into your cart recovery performance metrics.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Conversions"
          value="227"
          trend="↑ 12.5%"
          trendLabel="from last week"
          icon={TrendingUp}
        />
        <StatCard
          title="Avg. Recovery Time"
          value="2.4h"
          trend="↓ 18%"
          trendLabel="faster"
          icon={Clock}
          inverse={true}
        />
        <StatCard
          title="Message Open Rate"
          value="87.3%"
          trend="↑ 5.2%"
          trendLabel="improvement"
          icon={MessageSquare}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversions Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all"
        >
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
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                />
                <Bar dataKey="conversions" fill="#25D366" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Channel Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all"
        >
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
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
