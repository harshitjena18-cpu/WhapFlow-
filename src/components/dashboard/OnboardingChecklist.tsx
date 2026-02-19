import { CheckCircle2, Circle, Lock, ArrowRight, Loader2, PlayCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { toast } from "sonner";
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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
  integrations: {
    shopify_connected: boolean;
    whatsapp_connected: boolean;
    shopify?: { connection_status: string };
    whatsapp?: { connection_status: string };
  };
  automation: {
    status: 'active' | 'paused';
    reason: string;
  };
}

interface OnboardingChecklistProps {
  data: ReadinessData;
  onRefresh: () => void;
}

export function OnboardingChecklist({ data, onRefresh }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState<string | null>(null);

  // Helper to update integration status (Simulating the OAuth callback)
  const connectIntegration = async (type: 'shopify' | 'whatsapp') => {
    try {
      setConnecting(type);
      
      // Get current status to preserve the other one
      const currentStatus = {
        shopify_connected: data.integrations.shopify?.connection_status === 'connected',
        whatsapp_connected: data.integrations.whatsapp?.connection_status === 'connected'
      };
      
      const newStatus = {
        ...currentStatus,
        [type === 'shopify' ? 'shopify_connected' : 'whatsapp_connected']: true
      };

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a/api/integrations/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(newStatus)
      });

      if (!res.ok) throw new Error("Connection failed");

      toast.success(`${type === 'shopify' ? 'Shopify' : 'WhatsApp'} connected successfully`);
      onRefresh(); // Refresh dashboard data
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect integration");
    } finally {
      setConnecting(null);
    }
  };

  // Step Logic
  const steps = [
    {
      id: 1,
      title: "Create a message template",
      description: "Write your recovery message or generate one with AI.",
      isCompleted: data.templates.total > 0,
      isBlocked: false, // Always available
      action: {
        label: "Go to Templates",
        onClick: () => navigate('/templates')
      }
    },
    {
      id: 2,
      title: "Enable a template",
      description: "Select a template to be sent to customers.",
      isCompleted: data.templates.has_enabled,
      isBlocked: data.templates.total === 0,
      blockedReason: "Create a template first.",
      action: {
        label: "Manage Templates",
        onClick: () => navigate('/templates')
      }
    },
    {
      id: 3,
      title: "Connect WhatsApp",
      description: "Link your Meta Business account to send messages.",
      isCompleted: data.integrations.whatsapp?.connection_status === 'connected',
      isBlocked: !data.templates.has_enabled,
      blockedReason: "Complete previous steps to proceed.",
      action: {
        label: "Connect WhatsApp",
        onClick: () => connectIntegration('whatsapp'),
        loading: connecting === 'whatsapp'
      }
    },
    {
      id: 4,
      title: "Connect Shopify",
      description: "Sync your store to detect abandoned carts.",
      isCompleted: data.integrations.shopify?.connection_status === 'connected',
      isBlocked: !(data.integrations.whatsapp?.connection_status === 'connected'),
      blockedReason: "Connect WhatsApp first.",
      action: {
        label: "Connect Shopify",
        onClick: () => connectIntegration('shopify'),
        loading: connecting === 'shopify'
      }
    },
    {
      id: 5,
      title: "Activate Automation",
      description: "System will automatically start recovering carts.",
      isCompleted: data.automation.status === 'active',
      isBlocked: !(data.integrations.shopify?.connection_status === 'connected') || !data.billing.automation_enabled,
      blockedReason: !data.billing.automation_enabled 
        ? `Upgrade from ${data.billing.plan_name} to enable` 
        : "Connect all integrations to activate.",
      action: !data.billing.automation_enabled ? {
        label: "Upgrade Plan",
        onClick: () => navigate('/billing')
      } : null 
    }
  ];

  // Find the first non-completed step to highlight it
  const currentStepIndex = steps.findIndex(s => !s.isCompleted);
  const activeStepId = currentStepIndex === -1 ? 6 : steps[currentStepIndex].id;

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl overflow-hidden shadow-sm card-glow light-reflection">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-100/80 flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
          <p className="text-sm text-gray-500">Complete these steps to go live</p>
        </div>
        <span className="text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2 py-1 rounded-full shadow-sm">
          {steps.filter(s => s.isCompleted).length} / {steps.length} Completed
        </span>
      </div>

      <div className="divide-y divide-gray-100/80">
        {steps.map((step, index) => {
          const isCurrent = step.id === activeStepId;
          const isPast = step.isCompleted;
          
          return (
            <div 
              key={step.id} 
              className={`p-6 transition-all duration-300 ${isCurrent ? 'bg-gradient-to-r from-blue-50/40 to-indigo-50/20' : 'bg-white/50'} ${step.isBlocked ? 'opacity-60' : ''} relative z-10`}
            >
              <div className="flex items-start gap-4">
                {/* Icon Status */}
                <div className="flex-shrink-0 mt-1">
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : step.isBlocked ? (
                    <Lock className="w-6 h-6 text-gray-300" />
                  ) : (
                    <div className="relative">
                      <Circle className="w-6 h-6 text-blue-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-medium ${step.isCompleted ? 'text-gray-900' : isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-lg">
                        {step.description}
                      </p>
                      
                      {/* Blocked Reason */}
                      {step.isBlocked && (
                        <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {step.blockedReason}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    {!step.isCompleted && !step.isBlocked && step.action && (
                      <Button 
                        size="sm" 
                        onClick={step.action.onClick}
                        disabled={step.action.loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {step.action.loading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                        {step.action.label}
                        {!step.action.loading && <ArrowRight className="w-3 h-3 ml-2" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Success State */}
        {data.automation.status === 'active' && (
          <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50/50 text-center relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-green-900">System Active</h3>
            <p className="text-green-700 text-sm">Whapflow is running in production mode.</p>
          </div>
        )}
      </div>
    </div>
  );
}