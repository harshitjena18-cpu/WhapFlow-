import { Check, CreditCard, Sparkles, Zap, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
    price: '$29',
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
    price: '$79',
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
    price: '$199',
    period: '/month',
    features: ['Unlimited AI', '3,000 WhatsApp conversations', 'Dedicated manager', 'Custom integrations'],
    limit: '3,000 WhatsApp messages',
    current: false,
    cta: 'Contact Sales',
    popular: false
  },
];

export function BillingView() {
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
              Current Plan: Free
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Your billing cycle resets on March 1, 2026.
            </p>
          </div>
          <Button className="bg-white text-gray-900 hover:bg-gray-100 font-semibold">
            Manage Subscription
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-700 pt-8">
           <div>
             <div className="flex justify-between mb-2">
               <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-orange-400" /> AI Generations
               </span>
               <span className="text-sm font-bold">0 / 5</span>
             </div>
             <div className="w-full bg-gray-700 rounded-full h-2">
               <div className="bg-orange-500 h-2 rounded-full w-[0%]"></div>
             </div>
           </div>
           
           <div>
             <div className="flex justify-between mb-2">
               <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-green-400" /> WhatsApp Conversations
               </span>
               <span className="text-sm font-bold">0 / 0</span>
             </div>
             <div className="w-full bg-gray-700 rounded-full h-2">
               <div className="bg-green-500 h-2 rounded-full w-[0%]"></div>
             </div>
             <p className="text-xs text-gray-500 mt-2">Upgrade to unlock WhatsApp automation.</p>
           </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
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
                variant={plan.current ? "outline" : "default"}
                className={`w-full ${
                  plan.current
                    ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50 cursor-default'
                    : plan.id === 'pro' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                disabled={plan.current}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
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
