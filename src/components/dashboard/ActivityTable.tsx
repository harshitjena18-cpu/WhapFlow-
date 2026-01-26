import { ActivityLog } from '../../types';

interface ActivityTableProps {
  activities: ActivityLog[];
}

const statusStyles = {
  Converted: 'bg-[#25D366] text-white border-[#25D366]',
  Sent: 'bg-gray-50 text-gray-700 border-gray-200',
  Pending: 'bg-gray-50 text-gray-700 border-gray-200',
  Failed: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-8 py-7 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-sm text-gray-500 mt-1.5">Latest cart recovery interactions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Customer
              </th>
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Revenue
              </th>
              <th
                scope="col"
                className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <tr
                key={activity.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-700 text-xs font-semibold">
                        {activity.customer.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.customer}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <p className="text-sm text-gray-600">{activity.product}</p>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  <span
                    className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      statusStyles[activity.messageStatus]
                    }`}
                  >
                    {activity.messageStatus}
                  </span>
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  <p className="text-sm font-semibold text-gray-900">
                    {activity.revenue > 0 ? `$${activity.revenue.toFixed(2)}` : '—'}
                  </p>
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">
                  {activity.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}