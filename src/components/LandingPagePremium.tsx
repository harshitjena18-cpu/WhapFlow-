import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  TrendingUp, 
  Zap, 
  ShoppingCart, 
  BarChart3, 
  Clock, 
  ArrowRight,
  Check,
  Shield,
  Globe,
  Store,
  Target,
  Sparkles,
  Play,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { useRef } from 'react';
import { WhapflowLogo } from './WhapflowLogo';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

interface PricingPlan {
  name: string;
  price: number;
  ai_limit: number | null;
  whatsapp_limit: number;
  automation_enabled: boolean;
  features: string[];
  highlighted?: boolean;
}

export function LandingPagePremium() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const pricingRef = useRef(null);
  
  const isHeroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });
  const isPricingInView = useInView(pricingRef, { once: true, margin: "-100px" });

  // Fetch pricing from backend
  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a/api/billing/plans`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const plans = [
            {
              name: 'Free',
              price: 0,
              ai_limit: data.plans.free.ai_limit,
              whatsapp_limit: data.plans.free.whatsapp_limit,
              automation_enabled: data.plans.free.automation_enabled,
              features: [
                `${data.plans.free.ai_limit} AI generations`,
                `${data.plans.free.whatsapp_limit} WhatsApp conversations`,
                'Basic analytics',
                'No automation'
              ]
            },
            {
              name: 'Starter',
              price: 19,
              ai_limit: data.plans.starter.ai_limit,
              whatsapp_limit: data.plans.starter.whatsapp_limit,
              automation_enabled: data.plans.starter.automation_enabled,
              features: [
                `${data.plans.starter.ai_limit} AI generations/month`,
                `${data.plans.starter.whatsapp_limit} WhatsApp conversations`,
                'Automation enabled',
                'Email support'
              ]
            },
            {
              name: 'Growth',
              price: 49,
              ai_limit: data.plans.growth.ai_limit,
              whatsapp_limit: data.plans.growth.whatsapp_limit,
              automation_enabled: data.plans.growth.automation_enabled,
              highlighted: true,
              features: [
                `${data.plans.growth.ai_limit} AI generations/month`,
                `${data.plans.growth.whatsapp_limit} WhatsApp conversations`,
                'Automation enabled',
                'Priority support',
                'Advanced analytics'
              ]
            },
            {
              name: 'Pro',
              price: 99,
              ai_limit: data.plans.pro.ai_limit,
              whatsapp_limit: data.plans.pro.whatsapp_limit,
              automation_enabled: data.plans.pro.automation_enabled,
              features: [
                'Unlimited AI generations',
                `${data.plans.pro.whatsapp_limit} WhatsApp conversations`,
                'Automation enabled',
                '24/7 priority support',
                'Custom integrations',
                'Dedicated account manager'
              ]
            }
          ];
          setPricingPlans(plans);
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback pricing
        setPricingPlans([
          {
            name: 'Free',
            price: 0,
            ai_limit: 5,
            whatsapp_limit: 0,
            automation_enabled: false,
            features: ['5 AI generations', '0 WhatsApp conversations', 'Basic analytics', 'No automation']
          },
          {
            name: 'Starter',
            price: 19,
            ai_limit: 30,
            whatsapp_limit: 300,
            automation_enabled: true,
            features: ['30 AI generations/month', '300 WhatsApp conversations', 'Automation enabled', 'Email support']
          },
          {
            name: 'Growth',
            price: 49,
            ai_limit: 100,
            whatsapp_limit: 1000,
            automation_enabled: true,
            highlighted: true,
            features: ['100 AI generations/month', '1,000 WhatsApp conversations', 'Automation enabled', 'Priority support', 'Advanced analytics']
          },
          {
            name: 'Pro',
            price: 99,
            ai_limit: null,
            whatsapp_limit: 3000,
            automation_enabled: true,
            features: ['Unlimited AI generations', '3,000 WhatsApp conversations', 'Automation enabled', '24/7 priority support', 'Custom integrations', 'Dedicated account manager']
          }
        ]);
      }
    }
    fetchPricing();
  }, []);

  useEffect(() => {
    // Performance optimization: Throttle scroll listener using requestAnimationFrame
    // and use passive option to prevent scroll lag on main thread.
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        globalThis.requestAnimationFrame(() => {
          setIsScrolled(globalThis.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
    {
      question: "How does WhatsApp cart recovery work?",
      answer: "When a customer abandons their cart, Whapflow automatically detects it and sends a personalized WhatsApp message to remind them to complete their purchase. Messages are sent at optimal times based on smart algorithms."
    },
    {
      question: "Is this compliant with WhatsApp policies?",
      answer: "Yes, Whapflow uses the official WhatsApp Business API and is fully compliant with all WhatsApp policies and data protection regulations."
    },
    {
      question: "Can I customize the messages?",
      answer: "Absolutely! You can create custom templates or use our AI to generate personalized messages. Each message can include customer name, cart items, and dynamic discount codes."
    },
    {
      question: "What if I exceed my plan limits?",
      answer: "We'll notify you when you're approaching your limits. You can upgrade your plan at any time, and we'll never send messages that would exceed your quota without permission."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      {/* Background grain texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none grain-texture z-0" />
      
      {/* Ambient light orbs */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-teal-400/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-emerald-400/20 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isScrolled 
            ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link to="/">
            <WhapflowLogo size="md" variant="full" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                Sign In
              </button>
            </Link>
            <Link to="/signup">
              <motion.button 
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32" ref={heroRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
            variants={staggerContainer}
            initial="hidden"
            animate={isHeroInView ? "visible" : "hidden"}
          >
            {/* Left: Text Content */}
            <div className="space-y-8">
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-full text-teal-300 text-sm font-medium backdrop-blur-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  Powered by AI & WhatsApp Business API
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight"
                variants={fadeInUp}
              >
                Recover Lost Sales with{' '}
                <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  WhatsApp Automation
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl lg:text-2xl text-gray-300 leading-relaxed"
                variants={fadeInUp}
              >
                Turn abandoned carts into revenue with intelligent WhatsApp reminders. 
                Automated, personalized, and conversion-optimized.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                variants={fadeInUp}
              >
                <Link to="/signup">
                  <motion.button 
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-lg font-semibold rounded-xl shadow-2xl shadow-teal-500/40 hover:shadow-teal-500/60 transition-all relative overflow-hidden group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Install on Shopify
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                </Link>
                
                <motion.button 
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-semibold rounded-xl hover:bg-white/15 transition-all"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2 justify-center">
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </span>
                </motion.button>
              </motion.div>
              
              <motion.p 
                className="text-sm text-gray-400 flex items-center gap-4"
                variants={fadeInUp}
              >
                <Check className="w-4 h-4 text-teal-400" /> No credit card required
                <Check className="w-4 h-4 text-teal-400" /> 14-day free trial
              </motion.p>
            </div>

            {/* Right: Floating Dashboard Mockup */}
            <motion.div 
              className="relative"
              variants={fadeInUp}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-emerald-500/30 blur-3xl" />
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-2xl p-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 space-y-4">
                  {/* Dashboard mockup content */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="h-3 w-24 bg-gray-700 rounded" />
                        <div className="h-2 w-16 bg-gray-800 rounded mt-2" />
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                      <span className="text-xs text-emerald-300 font-medium">Active</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
                        <div className="h-2 w-12 bg-gray-600 rounded mb-2" />
                        <div className="h-4 w-16 bg-gradient-to-r from-teal-400 to-emerald-400 rounded" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-full bg-gray-700 rounded" />
                          <div className="h-2 w-3/4 bg-gray-800 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 md:gap-12">
            <motion.div 
              className="flex items-center gap-3 text-gray-300"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-sm font-medium">5,000+ Shopify Stores</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 text-gray-300"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-sm font-medium">Official WhatsApp API</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-3 text-gray-300"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <span className="text-sm font-medium">40% Avg Recovery Rate</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 relative" ref={howItWorksRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Three simple steps to start recovering abandoned carts
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" style={{ width: '80%', left: '10%' }} />
            
            {[
              {
                step: 1,
                icon: Store,
                title: "Connect Your Store",
                description: "Link your Shopify store in minutes with our simple OAuth integration."
              },
              {
                step: 2,
                icon: ShoppingCart,
                title: "Cart Gets Abandoned",
                description: "We automatically detect when customers leave items in their cart without purchasing."
              },
              {
                step: 3,
                icon: MessageCircle,
                title: "WhatsApp Recovers Sale",
                description: "Personalized messages are sent automatically to bring customers back."
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
              >
                <motion.div
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:border-teal-500/50 transition-all group relative overflow-hidden"
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-emerald-500/0 to-cyan-500/0 group-hover:from-teal-500/10 group-hover:via-emerald-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
                  
                  <div className="relative z-10">
                    {/* Step number */}
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center mb-6">
                      <span className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                        {item.step}
                      </span>
                    </div>
                    
                    {/* Icon */}
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-all">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-slate-900/50 backdrop-blur-sm relative" ref={featuresRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to maximize cart recovery and boost revenue
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: BarChart3,
                title: "Revenue Analytics",
                description: "Track recovered revenue, conversion rates, and ROI with detailed analytics dashboards."
              },
              {
                icon: Clock,
                title: "Automated Message Timing",
                description: "Smart algorithms determine the optimal time to send recovery messages for maximum impact."
              },
              {
                icon: Globe,
                title: "Multi-Language Support",
                description: "Send messages in your customers' preferred language with automatic translation."
              },
              {
                icon: Target,
                title: "Discount Recovery Logic",
                description: "Automatically offer strategic discounts to hesitant customers to close the sale."
              },
              {
                icon: Shield,
                title: "WhatsApp Policy-Safe",
                description: "Fully compliant with WhatsApp Business API policies and data protection regulations."
              },
              {
                icon: Zap,
                title: "Smart Automation",
                description: "Set up once and let intelligent automation handle the rest, 24/7."
              }
            ].map((feature, _index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-xl p-8 hover:border-teal-500/50 transition-all relative overflow-hidden h-full">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/10 group-hover:to-emerald-500/10 transition-all duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 rounded-lg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-900/20 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powerful Dashboard
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Monitor your cart recovery performance in real-time with actionable insights
            </p>
          </motion.div>

          <motion.div
            className="relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 blur-3xl" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/40">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-400 text-lg">Dashboard preview coming soon</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-slate-900/50 backdrop-blur-sm" ref={pricingRef}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {pricingPlans.map((plan, _index) => (
              <motion.div
                key={plan.name}
                variants={fadeInUp}
                whileHover={{ scale: plan.highlighted ? 1.02 : 1.05, y: -5 }}
                className={`relative ${plan.highlighted ? 'lg:scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 h-full transition-all ${
                  plan.highlighted 
                    ? 'border-2 border-teal-500/50 shadow-2xl shadow-teal-500/20' 
                    : 'border border-white/20 hover:border-teal-500/30'
                }`}>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                        ${plan.price}
                      </span>
                      <span className="text-gray-400">/month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/signup" className="block mt-auto">
                    <motion.button 
                      className={`w-full py-3 px-6 font-semibold rounded-xl transition-all ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50'
                          : 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:border-teal-500/30 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-semibold text-white">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <motion.div
                  initial={false}
                  animate={{ 
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 opacity-90" />
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-emerald-400/20 to-cyan-400/20"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Stop Losing Sales to Abandoned Carts
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of merchants recovering revenue with WhatsApp automation. 
              Start your free trial today and see results in days.
            </p>
            
            <Link to="/signup">
              <motion.button 
                className="px-10 py-5 bg-white text-teal-600 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-white/30 transition-all relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    '0 20px 50px rgba(255, 255, 255, 0.2)',
                    '0 25px 60px rgba(255, 255, 255, 0.3)',
                    '0 20px 50px rgba(255, 255, 255, 0.2)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            
            <p className="text-sm text-white/80 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950/80 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <WhapflowLogo size="md" variant="full" />
              <p className="text-sm text-gray-400">
                Recover abandoned carts with intelligent WhatsApp automation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-gray-400">© 2026 Whapflow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
