import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RevenueDataPoint } from '../../types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8">
      <div className="mb-10">
        <h2 className="text-base font-semibold text-gray-900">Revenue Over Time</h2>
        <p className="text-sm text-gray-500 mt-1.5">Track your recovered revenue performance</p>
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#f3f4f6' }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#f3f4f6' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #f3f4f6',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
                padding: '12px 16px',
              }}
              labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}
              itemStyle={{ color: '#6b7280', fontWeight: 500, fontSize: '13px' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              cursor={{ stroke: '#f3f4f6', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#25D366"
              strokeWidth={2}
              dot={{ fill: '#25D366', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#25D366' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}