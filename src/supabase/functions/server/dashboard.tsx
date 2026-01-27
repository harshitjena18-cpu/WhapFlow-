import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const dashboardApp = new Hono();

// Mock data to serve as default/fallback
const defaultMetrics = [
  {
    id: '1',
    title: 'Recovered Revenue',
    value: '$47,582',
    change: '+12.5%',
    trend: 'up',
    icon: 'DollarSign',
  },
  {
    id: '2',
    title: 'Messages Sent',
    value: '2,847',
    change: '+8.2%',
    trend: 'up',
    icon: 'Send',
  },
  {
    id: '3',
    title: 'Conversion Rate',
    value: '32.8%',
    change: '+4.3%',
    trend: 'up',
    icon: 'TrendingUp',
  },
  {
    id: '4',
    title: 'Abandoned Carts',
    value: '184',
    change: '-15.7%',
    trend: 'down',
    icon: 'ShoppingCart',
  },
];

const defaultRevenueData = [
  { date: 'Jan 1', revenue: 4200 },
  { date: 'Jan 8', revenue: 5100 },
  { date: 'Jan 15', revenue: 4800 },
  { date: 'Jan 22', revenue: 6300 },
  { date: 'Jan 29', revenue: 7200 },
  { date: 'Feb 5', revenue: 6800 },
  { date: 'Feb 12', revenue: 8100 },
  { date: 'Feb 19', revenue: 9400 },
  { date: 'Feb 26', revenue: 8900 },
  { date: 'Mar 5', revenue: 10200 },
  { date: 'Mar 12', revenue: 11500 },
  { date: 'Mar 19', revenue: 10800 },
];

const defaultActivityLogs = [
  {
    id: '1',
    customer: 'Sarah Johnson',
    product: 'Premium Wireless Headphones',
    messageStatus: 'Converted',
    revenue: 299.99,
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    customer: 'Michael Chen',
    product: 'Smart Fitness Watch',
    messageStatus: 'Sent',
    revenue: 0,
    timestamp: '3 hours ago',
  },
  {
    id: '3',
    customer: 'Emma Williams',
    product: 'Leather Laptop Bag',
    messageStatus: 'Converted',
    revenue: 129.99,
    timestamp: '5 hours ago',
  },
  {
    id: '4',
    customer: 'James Rodriguez',
    product: 'Mechanical Keyboard',
    messageStatus: 'Pending',
    revenue: 0,
    timestamp: '6 hours ago',
  },
  {
    id: '5',
    customer: 'Lisa Anderson',
    product: 'Bluetooth Speaker',
    messageStatus: 'Converted',
    revenue: 89.99,
    timestamp: '8 hours ago',
  },
  {
    id: '6',
    customer: 'David Kim',
    product: 'USB-C Dock Station',
    messageStatus: 'Failed',
    revenue: 0,
    timestamp: '10 hours ago',
  },
  {
    id: '7',
    customer: 'Sophie Martinez',
    product: 'Wireless Mouse',
    messageStatus: 'Converted',
    revenue: 49.99,
    timestamp: '12 hours ago',
  },
];

const defaultAutomations = [
  {
    id: '1',
    name: 'Welcome Series',
    description: 'Send automated welcome messages to new customers',
    enabled: true,
    trigger: 'New customer signup',
    lastRun: '2 hours ago',
  },
  {
    id: '2',
    name: 'Cart Abandonment - 1 Hour',
    description: 'Follow up on abandoned carts after 1 hour',
    enabled: true,
    trigger: 'Cart abandoned',
    lastRun: '15 minutes ago',
  },
  {
    id: '3',
    name: 'Cart Abandonment - 24 Hours',
    description: 'Second follow-up on abandoned carts',
    enabled: true,
    trigger: 'Cart abandoned 24h',
    lastRun: '3 hours ago',
  },
  {
    id: '4',
    name: 'Post-Purchase Thank You',
    description: 'Thank customers after purchase',
    enabled: false,
    trigger: 'Order completed',
  },
  {
    id: '5',
    name: 'Review Request',
    description: 'Request product reviews 7 days after delivery',
    enabled: true,
    trigger: 'Order delivered',
    lastRun: '1 day ago',
  },
];

// GET /dashboard/data
dashboardApp.get("/data", async (c) => {
  // Try to get data from KV store
  try {
    const metrics = await kv.get("dashboard_metrics");
    const revenue = await kv.get("dashboard_revenue");
    const activity = await kv.get("dashboard_activity");

    if (metrics && revenue && activity) {
      return c.json({
        metrics,
        revenue,
        activity,
      });
    }

    // If missing, seed the KV store with defaults (optional, but good for persistence)
    await kv.set("dashboard_metrics", defaultMetrics);
    await kv.set("dashboard_revenue", defaultRevenueData);
    await kv.set("dashboard_activity", defaultActivityLogs);

    return c.json({
      metrics: defaultMetrics,
      revenue: defaultRevenueData,
      activity: defaultActivityLogs,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // Fallback to defaults if KV fails
    return c.json({
      metrics: defaultMetrics,
      revenue: defaultRevenueData,
      activity: defaultActivityLogs,
    });
  }
});

// GET /dashboard/automations
dashboardApp.get("/automations", async (c) => {
  try {
    const automations = await kv.get("dashboard_automations");
    if (automations) {
      return c.json({ automations });
    }
    await kv.set("dashboard_automations", defaultAutomations);
    return c.json({ automations: defaultAutomations });
  } catch (error) {
    return c.json({ automations: defaultAutomations });
  }
});

// POST /dashboard/automations/:id/toggle
dashboardApp.post("/automations/:id/toggle", async (c) => {
  const id = c.req.param("id");
  try {
    let automations: any[] = (await kv.get("dashboard_automations")) || defaultAutomations;
    
    automations = automations.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    
    await kv.set("dashboard_automations", automations);
    
    return c.json({ success: true, automations });
  } catch (error) {
    return c.json({ error: "Failed to toggle automation" }, 500);
  }
});

export default dashboardApp;
