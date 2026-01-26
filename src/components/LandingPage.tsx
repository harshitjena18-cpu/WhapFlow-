import { MessageCircle, TrendingUp, Zap, ShoppingCart, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logo from 'figma:asset/9ad57f78ffcb8b81f228eb1f033e9199d9c738a7.png';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#20BD5A] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Whapflow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">About</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-gray-50 transition-colors">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#20BD5A] hover:to-[#1BA84E] text-white shadow-sm hover:shadow-md transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-24 md:py-40">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-5 py-2.5 rounded-full border border-green-100 animate-fade-in">
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Recover up to 30% of abandoned carts</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight animate-slide-up">
              Turn Abandoned Carts into Revenue
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Automatically recover lost sales with personalized WhatsApp messages. 
              Connect with customers where they're already active and watch your revenue grow.
            </p>
            <div className="flex justify-center sm:justify-start pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#20BD5A] hover:to-[#1BA84E] text-white px-12 py-7 text-lg shadow-md hover:shadow-xl transition-all duration-300 rounded-xl group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-500">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXNoYm9hcmQlMjBhbmFseXRpY3MlMjBzY3JlZW58ZW58MXx8fHwxNzY5NDIzMTk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Whapflow Dashboard Preview"
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-gray-900 tracking-tight">+127%</p>
                  <p className="text-sm text-gray-600 mt-1">Recovery Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gradient-to-b from-gray-50 to-white py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-bold text-gray-900 tracking-tight">
              Everything you need to recover sales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Powerful automation meets intelligent messaging to bring customers back
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title="WhatsApp Integration"
              description="Send personalized recovery messages directly to your customers' WhatsApp with one-click setup."
              delay="0s"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Smart Automation"
              description="Set up automated follow-up sequences that trigger at the perfect time to maximize conversions."
              delay="0.1s"
            />
            <FeatureCard
              icon={<ShoppingCart className="w-6 h-6" />}
              title="Cart Tracking"
              description="Real-time monitoring of abandoned carts with detailed customer and product information."
              delay="0.2s"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Advanced Analytics"
              description="Track recovery rates, revenue, and ROI with comprehensive dashboards and reports."
              delay="0s"
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Timing Optimization"
              description="AI-powered send time optimization ensures messages arrive when customers are most likely to convert."
              delay="0.1s"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Revenue Recovery"
              description="Recover up to 30% of lost revenue with intelligent messaging and proven conversion strategies."
              delay="0.2s"
            />
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16 space-y-8">
            <p className="text-gray-500 font-medium tracking-wider text-sm">TRUSTED BY LEADING ECOMMERCE BRANDS</p>
            <div className="flex flex-wrap justify-center items-center gap-16 opacity-40">
              <div className="text-2xl font-bold text-gray-400 tracking-tight">SHOPIFY</div>
              <div className="text-2xl font-bold text-gray-400 tracking-tight">WOOCOMMERCE</div>
              <div className="text-2xl font-bold text-gray-400 tracking-tight">MAGENTO</div>
              <div className="text-2xl font-bold text-gray-400 tracking-tight">BIGCOMMERCE</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-16 text-center border border-green-100 shadow-sm hover:shadow-md transition-all duration-500">
            <h3 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
              Ready to recover your revenue?
            </h3>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of merchants who are turning abandoned carts into completed sales
            </p>
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#25D366] to-[#20BD5A] hover:from-[#20BD5A] hover:to-[#1BA84E] text-white px-12 py-6 text-lg shadow-md hover:shadow-xl transition-all duration-300 rounded-xl group"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#20BD5A] rounded-xl flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Whapflow</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Recover abandoned carts with intelligent WhatsApp automation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-6">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-gray-600">© 2026 Whapflow. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <div 
      className="bg-white p-10 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 group animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-[#25D366] group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
