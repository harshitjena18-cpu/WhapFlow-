import { MetricCard } from './MetricCard';
import { RevenueChart } from './RevenueChart';
import { ActivityTable } from './ActivityTable';
import { metrics, revenueData, activityLogs } from '../../data/mockData';

export function DashboardView() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-2">
          Welcome back! Here's an overview of your cart recovery performance.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={revenueData} />

      {/* Activity Table */}
      <ActivityTable activities={activityLogs} />
    </div>
  );
}
