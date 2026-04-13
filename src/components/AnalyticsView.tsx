import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Clock, Activity, TrendingUp, TrendingDown } from 'lucide-react';

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
        <div className="group bg-white border border-gray-100 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#25D366]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Conversions</h3>
            <div className="p-2 bg-[#25D366]/10 rounded-lg group-hover:bg-[#25D366]/20 transition-colors">
              <Target className="w-4 h-4 text-[#25D366]" />
            </div>
          </div>
          <p className="text-4xl font-semibold text-gray-900 tracking-tight">227</p>
          <div className="flex items-center gap-1.5 mt-4 text-emerald-700" aria-label="12.5% increase from last week">
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">12.5%</span>
            <span className="text-sm text-gray-400 font-normal ml-1">vs last week</span>
          </div>
        </div>

        <div className="group bg-white border border-gray-100 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#25D366]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avg. Recovery Time</h3>
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-semibold text-gray-900 tracking-tight">2.4h</p>
          <div className="flex items-center gap-1.5 mt-4 text-blue-700" aria-label="18% decrease, faster response">
            <TrendingDown className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">18%</span>
            <span className="text-sm text-gray-400 font-normal ml-1">faster response</span>
          </div>
        </div>

        <div className="group bg-white border border-gray-100 rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#25D366]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message Open Rate</h3>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-4xl font-semibold text-gray-900 tracking-tight">87.3%</p>
          <div className="flex items-center gap-1.5 mt-4 text-emerald-700" aria-label="5.2% increase, improved reach">
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">5.2%</span>
            <span className="text-sm text-gray-400 font-normal ml-1">improved reach</span>
          </div>
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
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '8px 12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {channelData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-xs font-medium text-gray-600">{entry.name}</span>
                <span className="text-xs text-gray-400">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}