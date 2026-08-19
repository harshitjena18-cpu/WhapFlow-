import { useEffect, useState } from 'react';
import { Automation } from '../types';
import { Play, Pause, Settings, Zap, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner";
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

export function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a/dashboard/automations`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAutomations(data.automations);
      }
    } catch (error) {
      console.error('Failed to fetch automations', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (id: string) => {
    // Set updating state
    setIsUpdating(prev => ({ ...prev, [id]: true }));

    // Optimistic update
    setAutomations(
      automations.map((automation) =>
        automation.id === id
          ? { ...automation, enabled: !automation.enabled }
          : automation
      )
    );

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a/dashboard/automations/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle');
      }
      
      const automation = automations.find(a => a.id === id);
      const action = automation?.enabled ? 'disabled' : 'enabled';
      toast.success(`Automation ${action} successfully`);
    } catch (error) {
      toast.error('Failed to update automation');
      // Revert on failure
      fetchAutomations();
    } finally {
      setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Automations</h1>
        <p className="text-sm text-gray-500 mt-2">
          Manage your automated workflows and messaging campaigns.
        </p>
      </div>

      {/* Automations List */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-8 py-7 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Active Workflows</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Enable or disable automated campaigns
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {automations.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No automations yet</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                Connect your store and set up your first abandoned cart recovery workflow to start seeing results.
              </p>
            </div>
          ) : (
            automations.map((automation) => (
              <div
                key={automation.id}
              className="px-8 py-7 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {automation.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors duration-200 ${
                        isUpdating[automation.id]
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : automation.enabled
                            ? 'bg-[#25D366] text-white border-[#25D366]'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {isUpdating[automation.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                          Updating...
                        </>
                      ) : automation.enabled ? (
                        <>
                          <Play className="w-3 h-3" aria-hidden="true" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3" aria-hidden="true" />
                          Paused
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {automation.description}
                  </p>
                  <div className="flex items-center gap-8 text-xs text-gray-500">
                    <span>
                      <span className="font-medium text-gray-700">Trigger:</span> {automation.trigger}
                    </span>
                    {automation.lastRun && (
                      <span>
                        <span className="font-medium text-gray-700">Last run:</span> {automation.lastRun}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                        disabled={isUpdating[automation.id]}
                        aria-label={`Toggle ${automation.name}`}
                        className="data-[state=checked]:bg-[#25D366]"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isUpdating[automation.id] ? "Updating..." : automation.enabled ? "Disable Automation" : "Enable Automation"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all active:scale-95"
                        aria-label="Automation settings"
                      >
                        <Settings className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Automation Settings (Coming Soon)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
