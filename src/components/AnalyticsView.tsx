import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Clock,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { motion } from 'motion/react';
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
  change: string;
  trend: 'up' | 'down';
  isGood?: boolean; // Defaults to trend === 'up' is good
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  index: number;
  trendLabel?: string;
}

const StatCard = memo(({
  title,
  value,
  change,
  trend,
  isGood = trend === 'up',
  icon: Icon,
  iconColor,
  iconBg,
  index,
  trendLabel
}: StatCardProps) => {
  const isTrendPositive = trend === 'up';

  return (
    <motion.div
      role="region"
      aria-label={`${title}: ${value}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
        </div>
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {isTrendPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>
            <span className="sr-only">{isTrendPositive ? 'Increased by' : 'Decreased by'}</span>
            {change}
          </span>
        </div>
      </div>

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
      {trendLabel && (
        <p className="text-sm text-gray-500 mt-4 flex items-center gap-1.5">
          <span className="sr-only">Trend context:</span>
          {trendLabel}
        </p>
      )}
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
          change="12.5%"
          trend="up"
          icon={Target}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
          index={0}
          trendLabel="from last week"
        />
        <StatCard
          title="Avg. Recovery Time"
          value="2.4h"
          change="18%"
          trend="down"
          isGood={true} // Lower recovery time is good
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          index={1}
          trendLabel="faster than average"
        />
        <StatCard
          title="Message Open Rate"
          value="87.3%"
          change="5.2%"
          trend="up"
          icon={MessageCircle}
          iconColor="text-[#25D366]"
          iconBg="bg-[#25D366]/10"
          index={2}
          trendLabel="improvement today"
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
                <ChartTooltip
                   contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
