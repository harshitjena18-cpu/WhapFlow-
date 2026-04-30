import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, MessageSquare, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  icon: React.ElementType;
  trendValue: string;
  trendLabel: string;
  isGood?: boolean;
}

function StatCard({ title, value, icon: Icon, trendValue, trendLabel, isGood = true }: StatCardProps) {
  const isUp = trendValue.includes('↑');
  const colorClass = isGood ? 'text-emerald-600' : 'text-red-600';

  return (
    <motion.div
      role="region"
      aria-label={`${title}: ${value}`}
      whileHover={{ y: -4 }}
      className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-[#25D366]/10 transition-colors duration-300">
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#25D366] group-hover:scale-110 transition-all duration-300" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</h3>
        <p className="text-4xl font-semibold text-gray-900 tracking-tight">{value}</p>
        <div className="flex items-center gap-1 mt-4">
          <span className={`flex items-center text-sm font-medium ${colorClass}`}>
            <span className="sr-only">{isUp ? 'Increased by' : 'Decreased by'}</span>
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" />}
            {trendValue.replace(/[↑↓]/, '').trim()}
          </span>
          <span className="text-sm text-gray-500">{trendLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}

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
          icon={TrendingUp}
          trendValue="↑ 12.5%"
          trendLabel="from last week"
          isGood={true}
        />
        <StatCard
          title="Avg. Recovery Time"
          value="2.4h"
          icon={Clock}
          trendValue="↓ 18%"
          trendLabel="faster"
          isGood={true}
        />
        <StatCard
          title="Message Open Rate"
          value="87.3%"
          icon={MessageSquare}
          trendValue="↑ 5.2%"
          trendLabel="improvement"
          isGood={true}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversions Chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
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
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                />
                <Bar dataKey="conversions" fill="#25D366" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
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
        </div>
      </div>
    </div>
  );
}
