import { Bell, Globe, Lock, User, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router';

export function SettingsView() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-2">
          Manage your account preferences and application settings.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        
        {/* Billing & Plans (New Section) */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Plan & Billing</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage your subscription and usage</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-6">
             <div>
               <p className="text-sm font-medium text-gray-900">Current Plan: <span className="font-bold">Free</span></p>
               <p className="text-sm text-gray-500 mt-1">Upgrade to unlock automation and higher limits.</p>
             </div>
             <button 
               onClick={() => navigate('/billing')}
               className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold text-sm transition-colors shadow-sm"
             >
               View Plans
             </button>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Profile</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage your personal information</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="john@whapflow.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>
            </div>
            <button className="px-6 py-3 bg-[#25D366] text-white rounded-xl hover:bg-[#20BD5A] font-semibold text-sm transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500 mt-0.5">Configure how you receive updates</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 space-y-5">
            {['Email notifications', 'SMS notifications', 'Push notifications', 'Weekly reports'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item}</span>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#25D366]"
                  role="switch"
                  aria-checked="true"
                >
                  <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Security</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage your security preferences</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 flex flex-wrap gap-3">
            <button className="px-6 py-3 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors">
              Change Password
            </button>
            <button className="px-6 py-3 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors">
              Enable Two-Factor Auth
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Preferences</h2>
                <p className="text-sm text-gray-500 mt-0.5">Customize your experience</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Language
              </label>
              <select className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-colors">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Timezone
              </label>
              <select className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-colors">
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+1 (CET)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
