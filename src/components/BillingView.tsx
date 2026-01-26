import { CreditCard, Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    features: ['Up to 500 messages/mo', 'Basic analytics', 'Email support', '2 team members'],
    current: false,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/month',
    features: ['Up to 2,500 messages/mo', 'Advanced analytics', 'Priority support', '10 team members', 'Custom templates'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    features: ['Unlimited messages', 'Custom analytics', '24/7 support', 'Unlimited team members', 'Custom integrations', 'Dedicated account manager'],
    current: false,
  },
];

export function BillingView() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Billing</h1>
        <p className="text-sm text-gray-500 mt-2">
          Manage your subscription and payment methods.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Current Plan</h2>
            <p className="text-sm text-gray-500 mt-1.5">You are currently on the Professional plan</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white border border-[#25D366] rounded-lg text-xs font-semibold">
            <Check className="w-3.5 h-3.5" />
            Active
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Next billing date</p>
            <p className="text-sm font-medium text-gray-900">April 1, 2026</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Amount</p>
            <p className="text-sm font-medium text-gray-900">$79.00</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment method</p>
            <p className="text-sm font-medium text-gray-900">•••• 4242</p>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 border ${
                plan.current
                  ? 'border-[#25D366] shadow-sm'
                  : 'border-gray-100'
              }`}
            >
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                {plan.current && (
                  <span className="inline-block mt-3 px-2.5 py-1 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-lg text-xs font-semibold">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mb-8">
                <span className="text-4xl font-semibold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.current
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-[#25D366] text-white hover:bg-[#20BD5A]'
                }`}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Payment Method</h2>
        <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Visa ending in 4242</p>
              <p className="text-xs text-gray-500 mt-1">Expires 12/2026</p>
            </div>
          </div>
          <button className="px-4 py-2 text-white bg-[#25D366] hover:bg-[#20BD5A] rounded-lg font-semibold text-sm transition-colors">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}