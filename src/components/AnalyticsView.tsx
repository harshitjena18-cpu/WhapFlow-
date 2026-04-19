import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Timer, MessageSquare, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
        <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              <span className="sr-only">Increase of</span>
              12.5%
            </div>
          </div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Conversions</h3>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">227</p>
          <p className="text-xs text-gray-500 mt-2">from last week</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Timer className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
              <span className="sr-only">Improvement of</span>
              18%
            </div>
          </div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg. Recovery Time</h3>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">2.4h</p>
          <p className="text-xs text-gray-500 mt-2">faster than average</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              <span className="sr-only">Increase of</span>
              5.2%
            </div>
          </div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Message Open Rate</h3>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">87.3%</p>
          <p className="text-xs text-gray-500 mt-2">engagement rate</p>
        </div>
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
                <Tooltip
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}