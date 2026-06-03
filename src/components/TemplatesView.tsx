import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { MessageCircle, Plus, Trash2, Check, Loader2, Sparkles, Copy, AlertCircle, Bot, Zap, Info } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger as _DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

// Types
interface Template {
  id: string;
  template_name: string; // Internal unique name
  display_name: string;  // UI friendly name
  delay_minutes: number;
  content?: string;      // The actual message content
  enabled: boolean;
  created_at: string;
  generated_by_ai?: boolean;
  ai_tone?: string;
}

interface AIUsage {
  ai_generations_used: number;
  ai_generations_limit: number;
  ai_usage_reset_at: string;
}

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c8eef56a`;

export function TemplatesView() {
  // SECURITY: Extract shop from URL to support multi-tenancy in API calls
  const shop = new URLSearchParams(window.location.search).get('shop') || 'global';
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Template>>({
    template_name: '',
    display_name: '',
    delay_minutes: 30,
    content: '',
    enabled: false,
    generated_by_ai: false,
    ai_tone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // AI Generator State
  const [aiTone, setAiTone] = useState("Friendly");
  const [aiBrand, setAiBrand] = useState("");
  const [aiDiscount, setAiDiscount] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null);

  // Integration State
  const [integrations, setIntegrations] = useState<{ shopify_connected: boolean; whatsapp_connected: boolean } | null>(null);

  // Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modifierKey, setModifierKey] = useState('⌘');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setCopiedId(prev => prev === id ? null : prev);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = contentRef.current;
    const { content = '' } = formData;
    if (!textarea) return setFormData(prev => ({ ...prev, content: content + variable }));

    const { selectionStart: start, selectionEnd: end } = textarea;
    setFormData(prev => ({ ...prev, content: content.slice(0, start) + variable + content.slice(end) }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // Validation State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/templates?shop=${shop}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data);
      // Select the first enabled one, or the first one, or null
      if (data.length > 0 && !selectedTemplate) {
        // Keep current selection if exists and in list, else select first
        setSelectedTemplate(data[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIUsage = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/ai/usage?shop=${shop}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiUsage(data);
      }
    } catch (err) {
      console.error("Failed to fetch AI usage", err);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/integrations/status?shop=${shop}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error("Failed to fetch integration status", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchAIUsage();
    fetchIntegrations();
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '');
    setModifierKey(isMac ? '⌘' : 'Ctrl');
  }, []);

  // Validation Logic
  const validateContent = (content: string = "") => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Blocking Rules
    if (!content.trim()) {
      errors.push("Template content cannot be empty.");
    }
    if (content.length > 1024) {
      errors.push(`Content exceeds 1024 characters (Current: ${content.length}).`);
    }
    if (!content.includes("{{checkout_link}}")) {
      errors.push("Template MUST include {{checkout_link}}.");
    }

    // Warnings
    if (content.length > 0 && content.length < 50) {
      warnings.push("Content seems very short. Consider adding more context.");
    }
    if (!content.includes("{{customer_name}}")) {
      warnings.push("Missing {{customer_name}} - personalization increases conversion.");
    }
    if (!content.includes("{{product_name}}")) {
      warnings.push("Missing {{product_name}} - reminding customers what they left helps.");
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
  };

  useEffect(() => {
    if (isDialogOpen) {
      validateContent(formData.content);
    }
  }, [formData.content, isDialogOpen]);

  // Handlers
  const handleOpenCreate = (prefillContent = "") => {
    setIsEditing(false);
    setFormData({
      template_name: '',
      display_name: '',
      delay_minutes: 30,
      content: prefillContent,
      enabled: false,
      generated_by_ai: !!prefillContent,
      ai_tone: prefillContent ? aiTone : undefined
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setIsEditing(true);
    setFormData({
      template_name: template.template_name,
      display_name: template.display_name,
      delay_minutes: template.delay_minutes,
      content: template.content || '',
      enabled: template.enabled,
      generated_by_ai: template.generated_by_ai,
      ai_tone: template.ai_tone
    });
    setSelectedTemplate(template); 
    setIsDialogOpen(true);
  };
  
  const handleSave = async () => {
    // Re-validate before saving to be safe
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before saving.");
      return;
    }

    if (!formData.template_name || !formData.display_name) {
      toast.error("Name and Display Name are required");
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditing && selectedTemplate 
        ? `${SERVER_URL}/api/templates/${selectedTemplate.id}`
        : `${SERVER_URL}/api/templates`;
        
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ ...formData, shop })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      
      const savedTemplate = await res.json();
      toast.success(isEditing ? "Template updated" : "Template created");
      setIsDialogOpen(false);
      fetchTemplates();
      setSelectedTemplate(savedTemplate);
    } catch (err) {
      // deno-lint-ignore no-explicit-any
      const error = err as any;
      console.error(error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/templates/${id}?shop=${shop}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success("Template deleted");
      if (selectedTemplate?.id === id) setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete template");
    }
  };

  const handleToggleEnabled = async (template: Template, checked: boolean) => {
    // Optimistic UI update
    const oldTemplates = [...templates];
    setTemplates(prev => prev.map(t => {
        if (t.id === template.id) return { ...t, enabled: checked };
        if (checked && t.id !== template.id) return { ...t, enabled: false };
        return t;
    }));

    try {
      const res = await fetch(`${SERVER_URL}/api/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ enabled: checked, shop })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      fetchTemplates();
      toast.success(checked ? "Template enabled" : "Template disabled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
      setTemplates(oldTemplates);
    }
  };

  // Helper to determine if automation can be enabled
  const canEnableAutomation = integrations?.shopify_connected && integrations?.whatsapp_connected;

  const handleGenerateAI = async () => {
    try {
      setAiGenerating(true);
      const res = await fetch(`${SERVER_URL}/api/templates/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          tone: aiTone,
          brand_name: aiBrand,
          discount: aiDiscount,
          shop
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }

      const data = await res.json();
      setAiSuggestions(data.suggestions);
      if (data.usage) {
        setAiUsage(data.usage);
      }
      toast.success("Templates generated!");
    } catch (err) {
      // deno-lint-ignore no-explicit-any
      const error = err as any;
      console.error(error);
      toast.error(error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const isLimitReached = aiUsage ? aiUsage.ai_generations_used >= aiUsage.ai_generations_limit : false;
  const usagePercentage = aiUsage ? (aiUsage.ai_generations_used / aiUsage.ai_generations_limit) * 100 : 0;

  return (
      <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure automated messages sent to recovered customers.
          </p>
        </div>
        <div className="flex gap-2">
            {/* Demo Button to Simulate Connection */}
            <Button variant="outline" size="sm" onClick={async () => {
                const newStatus = { shopify_connected: true, whatsapp_connected: true, shop };
                await fetch(`${SERVER_URL}/api/integrations/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                    body: JSON.stringify(newStatus)
                });
                setIntegrations(newStatus);
                toast.success("Integrations connected (Demo Mode)");
            }}>
                Connect Integrations (Demo)
            </Button>
            <Button onClick={() => handleOpenCreate()} className="bg-[#25D366] hover:bg-[#1fb855] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Template
            </Button>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="manage" className="px-4">Manage Templates</TabsTrigger>
          <TabsTrigger value="ai-generator" className="px-4 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            AI Template Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Template List */}
            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Templates</span>
                <span className="text-xs text-gray-500">{templates.length} total</span>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 flex justify-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-gray-500 text-sm">No templates yet. Create one!</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCreate()}
                      className="border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full px-4 py-4 text-left transition-all hover:bg-gray-50 flex items-start gap-3 group ${
                        selectedTemplate?.id === template.id ? 'bg-[#25D366]/5 border-l-4 border-l-[#25D366]' : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${template.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-sm font-medium truncate ${selectedTemplate?.id === template.id ? 'text-[#128C7E]' : 'text-gray-900'}`}>
                            {template.display_name}
                          </h3>
                          {template.enabled && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate font-mono">
                          {template.template_name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          Wait: {template.delay_minutes} mins
                          {template.generated_by_ai && <span className="text-purple-400 flex items-center gap-0.5 ml-1"><Sparkles className="w-2 h-2" /> AI</span>}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Details / Configuration */}
            <div className="lg:col-span-2">
              {selectedTemplate ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  
                  {/* Toolbar */}
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.display_name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${selectedTemplate.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {selectedTemplate.enabled ? 'Enabled - Sending Live' : 'Disabled - Not sending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" size="sm" onClick={() => handleOpenEdit(selectedTemplate)}>
                         Edit
                       </Button>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="text-red-500 hover:text-red-700 hover:bg-red-50"
                             onClick={() => setTemplateToDelete(selectedTemplate.id)}
                             aria-label="Delete template"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Delete template</p>
                         </TooltipContent>
                       </Tooltip>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="p-6 space-y-6">
                    
                    {/* Configuration Card */}
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        Configuration
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <span className="block text-xs font-medium text-gray-500 uppercase">Template Name (ID)</span>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                              {selectedTemplate.template_name}
                            </p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-gray-600"
                                  onClick={() => handleCopy(selectedTemplate.template_name, 'template_name')}
                                  aria-label={copiedId === 'template_name' ? "Copied template name" : "Copy template name"}
                                >
                                  {copiedId === 'template_name' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{copiedId === 'template_name' ? 'Copied!' : 'Copy to clipboard'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Must match WhatsApp Manager</p>
                        </div>
                        
                        <div>
                          <span className="block text-xs font-medium text-gray-500 uppercase">Automation Delay</span>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedTemplate.delay_minutes} minutes
                          </p>
                          <p className="mt-1 text-xs text-gray-500">Time to wait after cart abandonment</p>
                        </div>

                        <div className="md:col-span-2 pt-2 border-t border-gray-200 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="automation-switch" className="text-sm font-medium text-gray-900 cursor-pointer">
                                Enable Automation
                              </Label>
                              {canEnableAutomation ? (
                                <p id="automation-desc" className="text-xs text-gray-500">
                                  Activating this will disable any other active templates.
                                </p>
                              ) : (
                                <p id="automation-desc" className="text-xs text-red-500 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Connect Shopify and WhatsApp to activate automation
                                </p>
                              )}
                            </div>
                            <Switch 
                              id="automation-switch"
                              aria-describedby="automation-desc"
                              checked={selectedTemplate.enabled}
                              onCheckedChange={(c) => handleToggleEnabled(selectedTemplate, c)}
                              disabled={!canEnableAutomation}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Display */}
                    {selectedTemplate.content && (
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>Message Content</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-500 hover:text-[#25D366] transition-colors"
                                  onClick={() => {
                                    if (selectedTemplate.content) {
                                      handleCopy(selectedTemplate.content, 'template_content');
                                    }
                                  }}
                                  aria-label={copiedId === 'template_content' ? "Copied message content" : "Copy message content"}
                                >
                                  {copiedId === 'template_content' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{copiedId === 'template_content' ? 'Copied!' : 'Copy content'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {selectedTemplate.generated_by_ai && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> AI Generated ({selectedTemplate.ai_tone})
                            </span>
                          )}
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-800 whitespace-pre-wrap font-sans border border-gray-100">
                          {selectedTemplate.content}
                        </div>
                      </div>
                    )}

                    {/* Info Text */}
                    <div className="text-sm text-gray-500 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-100">
                      <p className="font-semibold mb-1">ℹ️ About Templates</p>
                      <p>
                        This configuration links your Whapflow automation to a pre-approved WhatsApp template.
                        The actual message content is managed in your Meta WhatsApp Manager to ensure compliance.
                        Whapflow only handles the <strong>trigger timing</strong> and <strong>customer targeting</strong>.
                      </p>
                    </div>

                  </div>
                </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                   <p className="text-lg font-medium text-gray-500">Select a template</p>
                   <p className="text-sm mt-1">or create a new one to get started</p>
                 </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-1 bg-white border border-purple-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-purple-50 to-white px-6 py-4 border-b border-purple-100">
                <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Generator
                </h2>
                <p className="text-sm text-purple-700 mt-1">
                  Create high-converting messages in seconds.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Usage Stats */}
                {aiUsage && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-medium text-gray-600 flex items-center gap-1">
                         <Zap className="w-3 h-3 text-orange-400" /> Monthly Credits
                       </span>
                       <span className="text-gray-900 font-mono">
                         {aiUsage.ai_generations_used} / {aiUsage.ai_generations_limit}
                       </span>
                    </div>
                    <Progress value={usagePercentage} className="h-1.5" />
                    {isLimitReached && (
                      <p className="text-[10px] text-red-500 font-medium">
                        Monthly limit reached. Resets {new Date(aiUsage.ai_usage_reset_at).toLocaleDateString()}.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Message Tone</Label>
                  <Select value={aiTone} onValueChange={setAiTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Brand Name (Optional)</Label>
                  <Input 
                    placeholder="e.g. Whapflow Store" 
                    value={aiBrand}
                    onChange={(e) => setAiBrand(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Discount Offer (Optional)</Label>
                  <Input 
                    placeholder="e.g. 10% OFF, Free Shipping" 
                    value={aiDiscount}
                    onChange={(e) => setAiDiscount(e.target.value)}
                  />
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        onClick={handleGenerateAI}
                        disabled={aiGenerating || isLimitReached}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Bot className="w-4 h-4 mr-2" />
                            {isLimitReached ? "Limit Reached" : "Generate Drafts"}
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {isLimitReached && (
                    <TooltipContent>
                      <p>You have used all your free AI credits for this month.</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-100 flex gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p>AI usage is limited to prevent abuse. Credits reset automatically every month.</p>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-6">
               {aiSuggestions.length > 0 ? (
                 <div className="grid gap-6">
                   {aiSuggestions.map((text, idx) => (
                     <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-purple-200 transition-all">
                       <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-2">
                           <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded">Option {idx + 1}</span>
                           <span className="text-xs text-gray-500">{text.length} chars</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleCopy(text, `ai-suggestion-${idx}`)}
                                 aria-label={copiedId === `ai-suggestion-${idx}` ? "Copied suggestion" : "Copy suggestion"}
                               >
                                 {copiedId === `ai-suggestion-${idx}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>{copiedId === `ai-suggestion-${idx}` ? 'Copied!' : 'Copy to clipboard'}</p>
                             </TooltipContent>
                           </Tooltip>
                           <Button
                             size="sm"
                             onClick={() => handleOpenCreate(text)}
                             className="bg-gray-900 text-white hover:bg-gray-800"
                           >
                             Use this Template
                           </Button>
                         </div>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-lg text-gray-800 text-sm whitespace-pre-wrap font-sans border border-gray-100">
                         {text}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                   {aiGenerating ? (
                      <div className="space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
                        <p className="text-purple-900 font-medium">Crafting messages...</p>
                      </div>
                   ) : (
                      <div className="space-y-2">
                        <Sparkles className="w-12 h-12 text-gray-300 mx-auto" />
                        <p className="text-gray-900 font-medium">Ready to generate</p>
                        <p className="text-sm max-w-sm mx-auto">Fill in the details on the left and let AI write your recovery messages.</p>
                      </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !submitting && validationErrors.length === 0) {
              e.preventDefault();
              handleSave();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>
              Configure the link to your WhatsApp Template.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="display_name" 
                  placeholder="e.g. Standard Recovery 30m" 
                  value={formData.display_name}
                  onChange={e => setFormData({...formData, display_name: e.target.value})}
                  aria-describedby="display_name_hint"
                  required
                />
                <p id="display_name_hint" className="text-[10px] text-gray-500">Internal name for your reference.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template_name">
                  WhatsApp Template Name (ID) <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="template_name" 
                  placeholder="e.g. abandoned_cart_recovery_v1" 
                  value={formData.template_name}
                  onChange={e => setFormData({...formData, template_name: e.target.value})}
                  aria-describedby="template_name_hint"
                  required
                />
                <p id="template_name_hint" className="text-[10px] text-gray-500">MUST match the exact name in Meta Business Manager.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Delay (Minutes)</Label>
                <Input 
                  id="delay" 
                  type="number"
                  min="1"
                  placeholder="30" 
                  value={formData.delay_minutes}
                  onChange={e => setFormData({...formData, delay_minutes: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

              <div className="space-y-2 h-full flex flex-col">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content">
                    Template Content (Reference Only) <span className="text-red-500">*</span>
                  </Label>
                  <span
                    id="char_counter"
                    aria-live="polite"
                    className={`text-[10px] ${
                    (formData.content?.length || 0) > 1024
                      ? 'text-red-500 font-bold'
                      : (formData.content?.length || 0) > 921
                        ? 'text-orange-500 font-semibold'
                        : 'text-gray-500'
                  }`}>
                    {formData.content?.length || 0} / 1024 chars
                  </span>
                </div>
                <Progress
                  value={Math.min(((formData.content?.length || 0) / 1024) * 100, 100)}
                  className="h-1.5 mb-1"
                  aria-label="Character limit progress"
                />
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  {[
                    { tag: '{{customer_name}}', desc: 'Insert customer full name' },
                    { tag: '{{product_name}}', desc: 'Insert name of abandoned products' },
                    { tag: '{{checkout_link}}', desc: 'Insert unique recovery link (Required)' }
                  ].map(variable => (
                    <Tooltip key={variable.tag}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => insertVariable(variable.tag)}
                          className="text-[10px] bg-gray-50 hover:bg-[#25D366]/10 hover:text-[#128C7E] hover:border-[#25D366]/30 text-gray-600 px-2.5 py-1.5 rounded-full border border-gray-200 transition-all flex items-center gap-1.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#25D366]/20 outline-none"
                          aria-label={variable.desc}
                        >
                          <Plus className="w-3 h-3" /> {variable.tag}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{variable.desc}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <Textarea 
                  id="content"
                  ref={contentRef}
                  placeholder="Paste your template content here... e.g. Hi {{customer_name}}, you left {{product_name}} in your cart. Check out here: {{checkout_link}}" 
                  className={`flex-1 min-h-[150px] font-mono text-sm resize-none bg-gray-50 ${validationErrors.length > 0 ? 'border-red-300 focus:ring-red-200' : ''}`}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  aria-describedby="char_counter validation_msgs content_hint"
                  required
                />
                
                {/* Validation Messages */}
                {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                  <div id="validation_msgs" className="space-y-2 mt-1">
                    {validationErrors.map((err, idx) => (
                      <div key={`err-${idx}`} className="text-[10px] text-red-600 bg-red-50 p-2 rounded flex items-start gap-1.5 border border-red-100">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                    {validationWarnings.map((warn, idx) => (
                      <div key={`warn-${idx}`} className="text-[10px] text-orange-600 bg-orange-50 p-2 rounded flex items-start gap-1.5 border border-orange-100">
                        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {formData.generated_by_ai && (
                  <p className="text-[10px] text-purple-600 flex items-center gap-1 mt-1">
                    <Sparkles className="w-3 h-3" /> 
                    Generated by AI ({formData.ai_tone})
                  </p>
                )}
                <div id="content_hint" className="bg-blue-50 text-blue-800 p-2 rounded text-[10px] border border-blue-100 flex items-start gap-2 mt-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <p>Editing this text does NOT update WhatsApp. You must update the template in Meta Business Manager to match. Validation helps ensure approval.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={submitting || validationErrors.length > 0}
                aria-keyshortcuts={`${modifierKey}+Enter`}
                title={`Save Template (${modifierKey}+Enter)`}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Template
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template
              "{templates.find(t => t.id === templateToDelete)?.display_name}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (templateToDelete) handleDelete(templateToDelete);
                setTemplateToDelete(null);
              }}
              variant="destructive"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
