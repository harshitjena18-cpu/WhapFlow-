import { 
  MessageCircle, 
  Zap, 
  ShoppingCart, 
  BarChart3, 
  Clock, 
  Check,
  Shield,
  Globe,
  Store,
  Target
} from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WhapflowLogo } from './WhapflowLogo';

export function LandingPageNew() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link to="/">
            <WhapflowLogo size="md" variant="full" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                Sign In
              </button>
            </Link>
            <Link to="/signup">
              <button className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold rounded-lg transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Recover Lost Sales with WhatsApp
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                Send automated WhatsApp reminders to customers who abandon their carts. 
                Turn missed opportunities into revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/signup">
                  <button 
                    className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white text-lg font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                    aria-label="Start free trial"
                  >
                    Start Free Trial
                  </button>
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                No credit card required • Free 14-day trial
              </p>
            </div>

            {/* Right: Dashboard Mockup */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                  alt="Whapflow Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 md:gap-12">
            <div className="flex items-center gap-3 text-gray-600">
              <Store className="w-5 h-5 text-[#25D366]" />
              <span className="text-sm font-medium">Trusted by 5,000+ Shopify Stores</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Shield className="w-5 h-5 text-[#25D366]" />
              <span className="text-sm font-medium">Official WhatsApp API</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5 text-[#25D366]" />
              <span className="text-sm font-medium">Setup in 5 Minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start recovering abandoned carts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-2xl border border-gray-100 hover:border-[#25D366] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-[#25D366]">1</span>
              </div>
              <div className="w-14 h-14 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                <Store className="w-7 h-7 text-[#25D366]" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Connect Your Store</h3>
              <p className="text-gray-600 leading-relaxed">
                Link your Shopify, WooCommerce, or custom store in minutes with our simple integration.
              </p>
            </div>

            <div className="bg-white p-10 rounded-2xl border border-gray-100 hover:border-[#25D366] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-[#25D366]">2</span>
              </div>
              <div className="w-14 h-14 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                <ShoppingCart className="w-7 h-7 text-[#25D366]" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Cart Gets Abandoned</h3>
              <p className="text-gray-600 leading-relaxed">
                We automatically detect when customers leave items in their cart without completing purchase.
              </p>
            </div>

            <div className="bg-white p-10 rounded-2xl border border-gray-100 hover:border-[#25D366] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-[#25D366]">3</span>
              </div>
              <div className="w-14 h-14 bg-[#25D366]/10 rounded-xl flex items-center justify-center mb-6">
                <MessageCircle className="w-7 h-7 text-[#25D366]" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">WhatsApp Recovers Sale</h3>
              <p className="text-gray-600 leading-relaxed">
                Personalized WhatsApp messages are sent automatically to bring customers back to complete their order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to maximize cart recovery and boost revenue
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Revenue Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track recovered revenue, conversion rates, and ROI with detailed analytics dashboards.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-5">
                <Clock className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automated Message Timing</h3>
              <p className="text-gray-600 leading-relaxed">
                Smart algorithms determine the optimal time to send recovery messages for maximum impact.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-5">
                <Globe className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Language Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Send messages in your customers' preferred language with automatic translation.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Discount Recovery Logic</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically offer strategic discounts to hesitant customers to close the sale.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">WhatsApp Policy-Safe</h3>
              <p className="text-gray-600 leading-relaxed">
                Fully compliant with WhatsApp Business API policies and data protection regulations.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl">
              <div className="w-12 h-12 bg-[#25D366]/10 rounded-lg flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Automation</h3>
              <p className="text-gray-600 leading-relaxed">
                Set up once and let intelligent automation handle the rest, 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Try before you commit</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">5 AI generations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">0 WhatsApp conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Basic analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">No automation</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full py-3 px-6 bg-white border-2 border-gray-900 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">$19</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">Perfect for small stores testing cart recovery</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">30 AI generations/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">300 WhatsApp conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Automation enabled</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full py-3 px-6 bg-white border-2 border-gray-900 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Start Free Trial
                </button>
              </Link>
            </div>

            {/* Growth Plan - Highlighted */}
            <div className="bg-white p-8 rounded-2xl border-2 border-[#25D366] shadow-xl hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[#25D366] text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Growth</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">For growing stores scaling their recovery</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">100 AI generations/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">1,000 WhatsApp conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Automation enabled</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full py-3 px-6 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-colors">
                  Start Free Trial
                </button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600">For enterprise stores with high volume</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Unlimited AI generations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">3,000 WhatsApp conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Automation enabled</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">24/7 priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full py-3 px-6 bg-white border-2 border-gray-900 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Start Free Trial
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Stop Losing Sales to Abandoned Carts
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of merchants who are recovering revenue with WhatsApp automation. 
            Start your free trial today and see results in days.
          </p>
          <Link to="/signup">
            <button 
              className="px-10 py-5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              aria-label="Start free trial"
            >
              Start Free Trial
            </button>
          </Link>
          <p className="text-sm text-gray-400 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Whapflow</span>
              </div>
              <p className="text-sm text-gray-600">
                Recover abandoned carts with intelligent WhatsApp automation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 text-center">
            <p className="text-sm text-gray-600">© 2026 Whapflow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}