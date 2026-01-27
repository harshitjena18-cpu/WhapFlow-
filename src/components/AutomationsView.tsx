import { useEffect, useState } from 'react';
import { Automation } from '../types';
import { Play, Pause, Settings } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from "sonner@2.0.3";

export function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      toast.success('Automation updated');
    } catch (error) {
      toast.error('Failed to update automation');
      // Revert on failure
      fetchAutomations();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
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
          {automations.map((automation) => (
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
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                        automation.enabled
                          ? 'bg-[#25D366] text-white border-[#25D366]'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {automation.enabled ? (
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
                  <button
                    onClick={() => toggleAutomation(automation.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      automation.enabled ? 'bg-[#25D366]' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={automation.enabled}
                    aria-label={`Toggle ${automation.name}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        automation.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
