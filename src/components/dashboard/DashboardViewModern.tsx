import { useEffect, useState, useRef } from 'react';
import { 
  TrendingUp, 
  MessageCircle, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const chartVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

interface DashboardMetrics {
  cartRecoveryRate: number;
  cartRecoveryChange: number;
  totalRevenue: number;
  revenueChange: number;
  messagesDelivered: number;
  messagesChange: number;
  activeAutomations: number;
  automationsChange: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  recovered: number;
  abandoned: number;
}

export function DashboardViewModern() {
  // deno-lint-ignore no-unused-vars
  const [metrics, _setMetrics] = useState<DashboardMetrics>({
    cartRecoveryRate: 42.5,
    cartRecoveryChange: 18.6,
    totalRevenue: 9257.51,
    revenueChange: 15.8,
    messagesDelivered: 1847,
    messagesChange: 24.2,
    activeAutomations: 3,
    automationsChange: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  // deno-lint-ignore no-unused-vars
  const [dateRange, _setDateRange] = useState('Last 7 days');

  // Chart data
  const salesData: ChartDataPoint[] = [
    { name: 'Mon', value: 2598.2, recovered: 1200, abandoned: 1398 },
    { name: 'Tue', value: 1765.09, recovered: 900, abandoned: 865 },
    { name: 'Wed', value: 4005.66, recovered: 2100, abandoned: 1905 },
    { name: 'Thu', value: 1795.09, recovered: 950, abandoned: 845 },
    { name: 'Fri', value: 2598.2, recovered: 1300, abandoned: 1298 },
    { name: 'Sat', value: 3674, recovered: 1850, abandoned: 1824 },
    { name: 'Sun', value: 1821.05, recovered: 920, abandoned: 901 }
  ];

  const subscriberData = [
    { name: 'Sun', value: 2100 },
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1800 },
    { name: 'Wed', value: 3674 },
    { name: 'Thu', value: 2200 },
    { name: 'Fri', value: 2800 },
    { name: 'Sat', value: 2400 }
  ];

  const distributionData = [
    { name: 'Recovered', value: 45, color: '#14B8A6' },
    { name: 'Pending', value: 30, color: '#8B5CF6' },
    { name: 'Abandoned', value: 25, color: '#6B7280' }
  ];

  const integrationData = [
    { name: 'Shopify', type: 'E-commerce', rate: 85, profit: '$8,650' },
    { name: 'WhatsApp', type: 'Messaging', rate: 92, profit: '$720' },
    { name: 'Stripe', type: 'Payment', rate: 78, profit: '$432' }
  ];

  // Refs for scroll animations
  const metricsRef = useRef(null);
  const chartRef = useRef(null);
  const bottomRef = useRef(null);
  
  const metricsInView = useInView(metricsRef, { once: true, margin: "-50px" });
  const chartInView = useInView(chartRef, { once: true, margin: "-50px" });
  const bottomInView = useInView(bottomRef, { once: true, margin: "-50px" });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loader */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track your cart recovery performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <motion.button 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-4 h-4" />
            {dateRange}
          </motion.button>
          
          <motion.button 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4" />
            Filter
          </motion.button>
          
          <motion.button 
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div ref={metricsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Cart Recovery Rate"
          value={`${metrics.cartRecoveryRate}%`}
          change={metrics.cartRecoveryChange}
          icon={Target}
          iconColor="text-teal-500"
          iconBg="bg-teal-50"
          index={0}
          inView={metricsInView}
        />
        
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          change={metrics.revenueChange}
          icon={DollarSign}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
          index={1}
          inView={metricsInView}
        />
        
        <MetricCard
          title="Messages Delivered"
          value={metrics.messagesDelivered.toLocaleString()}
          change={metrics.messagesChange}
          icon={MessageCircle}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          index={2}
          inView={metricsInView}
        />
        
        <MetricCard
          title="Active Automations"
          value={metrics.activeAutomations.toString()}
          change={metrics.automationsChange}
          icon={Zap}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          index={3}
          inView={metricsInView}
        />
      </div>

      {/* Main Charts Row */}
      <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview - Larger Chart */}
        <motion.div 
          className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          variants={chartVariants}
          initial="hidden"
          animate={chartInView ? "visible" : "hidden"}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-500" />
                Sales Overview
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${metrics.totalRevenue.toLocaleString()}
                </span>
                <span className="text-sm text-teal-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {metrics.revenueChange}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="recovered" 
                  stroke="#14B8A6" 
                  strokeWidth={2}
                  fill="url(#colorRecovered)" 
                  animationDuration={600}
                  animationEasing="ease-out"
                />
                <Area 
                  type="monotone" 
                  dataKey="abandoned" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fill="url(#colorAbandoned)"
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-xs text-gray-600">Recovered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-600">Abandoned</span>
            </div>
          </div>
        </motion.div>

        {/* Subscriber Chart */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          variants={chartVariants}
          initial="hidden"
          animate={chartInView ? "visible" : "hidden"}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Cart Activity
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {metrics.messagesDelivered}
                </span>
                <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Weekly
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriberData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                  animationDuration={500}
                  animationEasing="ease-out"
                  animationBegin={100}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div ref={bottomRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          variants={chartVariants}
          initial="hidden"
          animate={bottomInView ? "visible" : "hidden"}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Cart Distribution</h3>
              <p className="text-sm text-gray-500 mt-1">Recovery status breakdown</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between gap-8">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-4">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Integration List */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          variants={chartVariants}
          initial="hidden"
          animate={bottomInView ? "visible" : "hidden"}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Active Integrations</h3>
              <p className="text-sm text-gray-500 mt-1">Connected services</p>
            </div>
            <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              See All
            </button>
          </div>
          
          <div className="space-y-4">
            {integrationData.map((integration, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all group"
                initial={{ opacity: 0, x: -20 }}
                animate={bottomInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                    <div className="text-xs text-gray-500">{integration.type}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Performance</div>
                    <div className="text-sm font-semibold text-gray-900">{integration.rate}%</div>
                  </div>
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={bottomInView ? { width: `${integration.rate}%` } : {}}
                      transition={{ duration: 0.6, delay: index * 0.1 + 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  index: number;
  inView: boolean;
}

function MetricCard({ title, value, change, icon: Icon, iconColor, iconBg, index, inView }: MetricCardProps) {
  const isPositive = change >= 0;
  
  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isPositive 
              ? 'bg-teal-50 text-teal-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </motion.div>
  );
}
