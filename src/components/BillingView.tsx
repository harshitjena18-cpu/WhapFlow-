import { Check, CreditCard, Sparkles, Zap, MessageSquare, Loader2, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['5 AI generations/mo', 'Manual templates', 'No automation', 'Community support'],
    limit: '0 WhatsApp messages',
    current: true, // Default
    cta: 'Current Plan',
    popular: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$19',
    period: '/month',
    features: ['30 AI generations/mo', '300 WhatsApp conversations', 'Automation enabled', 'Email support'],
    limit: '300 WhatsApp messages',
    current: false,
    cta: 'Upgrade',
    popular: true
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$49',
    period: '/month',
    features: ['100 AI generations/mo', '1,000 WhatsApp conversations', 'Priority support', 'Advanced analytics'],
    limit: '1,000 WhatsApp messages',
    current: false,
    cta: 'Upgrade',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/month',
    features: ['Unlimited AI', '3,000 WhatsApp conversations', 'Dedicated manager', 'Custom integrations'],
    limit: '3,000 WhatsApp messages',
    current: false,
    cta: 'Contact Sales',
    popular: false
  },
];

interface BillingData {
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
  billing_cycle_reset_at: string;
}

export function BillingView() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use "global" as default shop for MVP without multi-tenant auth
  const shop = 'global';

  useEffect(() => {
    async function fetchBillingData() {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a/api/dashboard/metrics?shop=${shop}`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch billing data');
        }

        const data = await response.json();
        setBillingData(data.readiness.billing);
      } catch (error) {
        console.error('Error loading billing data:', error);
        toast.error('Failed to load billing data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBillingData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin h-8 w-8 text-[#25D366]" />
        <p className="text-sm text-gray-500 animate-pulse">Loading your billing details...</p>
      </div>
    );
  }

  const currentPlan = billingData?.plan || 'free';
  const resetDate = billingData?.billing_cycle_reset_at 
    ? new Date(billingData.billing_cycle_reset_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'N/A';
  
  const aiUsed = billingData?.ai_usage.used || 0;
  const aiLimit = billingData?.ai_usage.limit || 5;
  const aiPercentage = aiLimit === Infinity ? 0 : (aiUsed / aiLimit) * 100;

  const whatsappUsed = billingData?.whatsapp_usage.used || 0;
  const whatsappLimit = billingData?.whatsapp_usage.limit || 0;
  const whatsappPercentage = whatsappLimit === 0 ? 0 : (whatsappUsed / whatsappLimit) * 100;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mt-2">
          Manage your subscription and view usage limits.
        </p>
      </div>

      {/* Current Usage Overview */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> 
              Current Plan: {billingData?.plan_name || 'Free'}
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
              <p>Your billing cycle resets on {resetDate}.</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="outline-none focus-visible:ring-1 focus-visible:ring-white rounded-full transition-all" aria-label="Billing cycle info">
                    <Info className="w-3.5 h-3.5 cursor-help opacity-70 hover:opacity-100" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your usage limits will refresh on this date.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <Button className="bg-white text-gray-900 hover:bg-gray-100 font-semibold transition-all active:scale-95 shadow-sm">
            Manage Subscription
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-700 pt-8">
           <div className="group">
             <div className="flex justify-between mb-3">
               <Tooltip>
                 <TooltipTrigger asChild>
                   <button type="button" className="text-sm font-medium text-gray-300 flex items-center gap-2 cursor-help group-hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white rounded-sm px-0.5 -ml-0.5">
                     <Zap className="w-4 h-4 text-orange-400" /> AI Generations
                   </button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Recovery messages generated with AI assistance.</p>
                 </TooltipContent>
               </Tooltip>
               <span className="text-sm font-bold">
                 {aiUsed} / {aiLimit === Infinity ? '∞' : aiLimit}
               </span>
             </div>
             <Progress
               value={Math.min(aiPercentage, 100)}
               className="h-2 bg-gray-700 [&_[data-slot=progress-indicator]]:bg-orange-500"
               aria-label="AI Generations Usage"
             />
           </div>
           
           <div className="group">
             <div className="flex justify-between mb-3">
               <Tooltip>
                 <TooltipTrigger asChild>
                   <button type="button" className="text-sm font-medium text-gray-300 flex items-center gap-2 cursor-help group-hover:text-white transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white rounded-sm px-0.5 -ml-0.5">
                     <MessageSquare className="w-4 h-4 text-green-400" /> WhatsApp Conversations
                   </button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Unique conversations initiated by automation.</p>
                 </TooltipContent>
               </Tooltip>
               <span className="text-sm font-bold">{whatsappUsed} / {whatsappLimit}</span>
             </div>
             <Progress
               value={Math.min(whatsappPercentage, 100)}
               className="h-2 bg-gray-700 [&_[data-slot=progress-indicator]]:bg-green-500"
               aria-label="WhatsApp Conversations Usage"
             />
             {whatsappLimit === 0 && (
               <p className="text-xs text-gray-500 mt-2 italic">Upgrade to unlock WhatsApp automation.</p>
             )}
           </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-6 border flex flex-col relative ${
                  plan.popular
                    ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={isCurrent ? "outline" : "default"}
                  className={`w-full ${
                    isCurrent
                      ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50 cursor-default'
                      : plan.id === 'pro' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History Placeholder */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 opacity-60">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-base font-semibold text-gray-900">Billing History</h2>
           <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <div className="text-center py-8 text-sm text-gray-500">
           Invoices will appear here once you subscribe to a paid plan.
        </div>
      </div>
    </div>
  );
}