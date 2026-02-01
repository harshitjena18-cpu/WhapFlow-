import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from "sonner@2.0.3";
import { CheckCircle2, XCircle, AlertCircle, FileText, Zap, ShoppingBag, MessageSquare, ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ReadinessData {
  templates: {
    total: number;
    has_enabled: boolean;
  };
  billing: {
    plan: 'free' | 'starter' | 'growth' | 'pro';
    plan_name: string;
    ai_usage: {
      used: number;
      limit: number;
    };
    whatsapp_usage: {
      used: number;
      limit: number;
    };
    automation_enabled: boolean;
  };
  // Keeping this for backward compatibility if needed, but we should switch to billing.ai_usage
  ai_usage: {
    used: number;
    limit: number;
  };
  integrations: {
    shopify_connected: boolean;
    whatsapp_connected: boolean;
  };
  automation: {
    status: 'active' | 'paused';
    reason: string;
  };
}

import { OnboardingChecklist } from './OnboardingChecklist';

export function DashboardView() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchDashboardData() {
    try {
      // Use "global" as default shop for MVP without multi-tenant auth
      const shop = 'global';
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a/api/dashboard/metrics?shop=${shop}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const jsonData = await response.json();
      setData(jsonData.readiness);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2">
            System Readiness & Status Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-white/80 backdrop-blur-sm border-gray-200/50 text-gray-700 shadow-sm">
            {data.billing.plan_name} Plan
          </Badge>
          {data.billing.plan === 'free' && (
            <Button 
              size="sm" 
              className="gradient-badge text-white border-0 hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => navigate('/billing')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {data.automation.status === 'paused' ? (
        <div className="relative ambient-glow status-glow-warning">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Automation Paused</h3>
              <p className="text-sm text-amber-700 mt-1">
                {data.automation.reason}. Automation will activate automatically once integrations are connected.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative ambient-glow status-glow-success">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 border border-green-200/60 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-green-900">Automation Active</h3>
              <p className="text-sm text-green-700 mt-1">
                Whapflow is monitoring your store and recovering carts.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Integrations Status */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm card-glow light-reflection">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
            <Zap className="w-4 h-4 text-blue-500" /> Integrations
          </h3>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center p-3 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-100/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Shopify</span>
              </div>
              {data.integrations.shopify_connected ? (
                <span className="text-xs font-medium text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Not Connected
                </span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-lg border border-gray-100/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">WhatsApp</span>
              </div>
              {data.integrations.whatsapp_connected ? (
                <span className="text-xs font-medium text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Not Connected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Templates Readiness */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm flex flex-col card-glow light-reflection">
          <div className="flex justify-between items-start mb-4 relative z-10">
             <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" /> Templates
             </h3>
             <Link to="/templates" className="text-xs text-purple-600 hover:text-purple-800 flex items-center transition-colors duration-200">
               Manage <ArrowRight className="w-3 h-3 ml-1" />
             </Link>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
             <div className="text-center">
               <span className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">{data.templates.total}</span>
               <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Templates Created</p>
             </div>
             
             <div className="border-t border-gray-100/80 pt-4">
               {data.templates.has_enabled ? (
                 <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                   <CheckCircle2 className="w-4 h-4" /> Ready to Send
                 </div>
               ) : (
                 <div className="flex items-center justify-center gap-2 text-sm text-amber-600 font-medium">
                   <AlertCircle className="w-4 h-4" /> No Active Template
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Usage & Billing */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl p-6 shadow-sm flex flex-col card-glow light-reflection">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
            <CreditCard className="w-4 h-4 text-indigo-500" /> Usage Limits
          </h3>
          
          <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
            {/* AI Credits */}
            <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600 flex items-center gap-1"><Zap className="w-3 h-3 text-orange-500" /> AI Credits</span>
                 <span className="font-mono font-medium text-xs">
                    {data.billing.ai_usage.limit === null || data.billing.ai_usage.limit === Infinity 
                      ? `${data.billing.ai_usage.used} / ∞` 
                      : `${data.billing.ai_usage.used} / ${data.billing.ai_usage.limit}`}
                 </span>
               </div>
               <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full gradient-progress rounded-full transition-all duration-500" 
                   style={{ width: `${data.billing.ai_usage.limit ? Math.min((data.billing.ai_usage.used / data.billing.ai_usage.limit) * 100, 100) : 0}%` }}
                 />
               </div>
            </div>

            {/* WhatsApp Limit */}
            <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600 flex items-center gap-1"><MessageSquare className="w-3 h-3 text-green-500" /> WhatsApp</span>
                 <span className="font-mono font-medium text-xs">
                    {data.billing.whatsapp_usage.used} / {data.billing.whatsapp_usage.limit}
                 </span>
               </div>
               <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full gradient-progress rounded-full transition-all duration-500" 
                   style={{ width: `${Math.min((data.billing.whatsapp_usage.used / data.billing.whatsapp_usage.limit) * 100, 100)}%` }}
                 />
               </div>
            </div>
            
            {!data.billing.automation_enabled && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 p-2 rounded text-xs text-center text-gray-500 border border-gray-100/80">
                Automation disabled on {data.billing.plan_name} plan
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist data={data} onRefresh={fetchDashboardData} />
    </div>
  );
}