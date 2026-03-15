import { Bell, Globe, Lock, User, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "sonner";

export function SettingsView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    "Email notifications": true,
    "SMS notifications": true,
    "Push notifications": true,
    "Weekly reports": false,
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Settings
        </h1>
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
                <h2 className="text-base font-semibold text-gray-900">
                  Plan & Billing
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your subscription and usage
                </p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Current Plan: <span className="font-bold">Free</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Upgrade to unlock automation and higher limits.
              </p>
            </div>
            <Button
              onClick={() => navigate("/billing")}
              className="px-6 py-2.5 h-auto bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              View Plans
            </Button>
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
                <h2 className="text-base font-semibold text-gray-900">
                  Profile
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your personal information
                </p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="full-name"
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  defaultValue={user?.user_metadata?.full_name || ""}
                  placeholder="John Doe"
                  key={user?.user_metadata?.full_name}
                  className="px-4 py-6 border-gray-200 rounded-xl focus-visible:ring-[#25D366]/20 focus-visible:border-[#25D366]"
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  placeholder="john@whapflow.com"
                  key={user?.email}
                  readOnly
                  className="px-4 py-6 border-gray-200 rounded-xl focus-visible:ring-[#25D366]/20 focus-visible:border-[#25D366] bg-gray-50"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-6 bg-[#25D366] text-white rounded-xl hover:bg-[#20BD5A] font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
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
                <h2 className="text-base font-semibold text-gray-900">
                  Notifications
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Configure how you receive updates
                </p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 space-y-5">
            {Object.entries(notifications).map(([item, enabled]) => (
              <div key={item} className="flex items-center justify-between">
                <Label
                  htmlFor={item.toLowerCase().replace(/\s+/g, "-")}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {item}
                </Label>
                <Switch
                  id={item.toLowerCase().replace(/\s+/g, "-")}
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [item]: checked }))
                  }
                  className="data-[state=checked]:bg-[#25D366]"
                />
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
                <h2 className="text-base font-semibold text-gray-900">
                  Security
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage your security preferences
                </p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="px-6 py-3 h-auto border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
            >
              Change Password
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="px-6 py-3 h-auto border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  Enable Two-Factor Auth
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add an extra layer of security to your account</p>
              </TooltipContent>
            </Tooltip>
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
                <h2 className="text-base font-semibold text-gray-900">
                  Preferences
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Customize your experience
                </p>
              </div>
            </div>
          </div>
          <div className="px-8 py-8 space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="language"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                Language
              </Label>
              <Select defaultValue="English">
                <SelectTrigger
                  id="language"
                  className="w-full md:w-64 h-12 border-gray-200 rounded-xl"
                >
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="timezone"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                Timezone
              </Label>
              <Select defaultValue="UTC-8 (Pacific Time)">
                <SelectTrigger
                  id="timezone"
                  className="w-full md:w-64 h-12 border-gray-200 rounded-xl"
                >
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-8 (Pacific Time)">
                    UTC-8 (Pacific Time)
                  </SelectItem>
                  <SelectItem value="UTC-5 (Eastern Time)">
                    UTC-5 (Eastern Time)
                  </SelectItem>
                  <SelectItem value="UTC+0 (GMT)">UTC+0 (GMT)</SelectItem>
                  <SelectItem value="UTC+1 (CET)">UTC+1 (CET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
