export interface Metric {
  id: string;
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface ActivityLog {
  id: string;
  customer: string;
  product: string;
  messageStatus: 'Converted' | 'Sent' | 'Pending' | 'Failed';
  revenue: number;
  timestamp: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string;
  lastRun?: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'whatsapp' | 'sms' | 'email';
  usageCount: number;
}

export interface NavItem {
  name: string;
  path: string;
  icon: string;
}
