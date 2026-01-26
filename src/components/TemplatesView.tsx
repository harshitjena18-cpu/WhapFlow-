import { useState } from 'react';
import { templates as initialTemplates } from '../data/mockData';
import { Template } from '../types';
import { MessageCircle, Mail, Smartphone, Edit2, Copy, Trash2 } from 'lucide-react';

const typeIcons = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: Smartphone,
};

const typeColors = {
  whatsapp: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20',
  email: 'bg-gray-50 text-gray-700 border-gray-200',
  sms: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function TemplatesView() {
  const [templates] = useState<Template[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    templates[0] || null
  );

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Templates</h1>
        <p className="text-sm text-gray-500 mt-2">
          Create and manage message templates for your campaigns.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">All Templates</h2>
            <p className="text-xs text-gray-500 mt-1">{templates.length} templates</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
            {templates.map((template) => {
              const Icon = typeIcons[template.type];
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full px-6 py-5 text-left hover:bg-gray-50 transition-colors ${
                    selectedTemplate?.id === template.id ? 'bg-[#25D366]/5 border-l-2 border-l-[#25D366]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        typeColors[template.type]
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {template.type} • {template.usageCount} uses
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {selectedTemplate ? (
            <>
              <div className="px-8 py-7 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {selectedTemplate.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1.5">
                      Used {selectedTemplate.usageCount} times
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      aria-label="Edit template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      aria-label="Duplicate template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      aria-label="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-8 py-8 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={selectedTemplate.subject}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-[#25D366]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Message Content
                  </label>
                  <textarea
                    value={selectedTemplate.content}
                    readOnly
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-mono text-sm focus:outline-none focus:border-[#25D366]"
                  />
                  <p className="text-xs text-gray-500 mt-3">
                    Available variables: {'{'}customer_name{'}'}, {'{'}product_name{'}'},
                    {'{'}order_number{'}'}, {'{'}tracking_url{'}'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-gray-500">
              <p className="text-sm">Select a template to view and edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
