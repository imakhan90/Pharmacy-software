import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Shield, Bell, Database, Globe, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'users', label: 'User Management', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'general', label: 'General Settings', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                  : "text-neutral-500 hover:bg-white hover:text-neutral-900"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {activeTab === 'profile' && (
            <div className="p-8 max-w-2xl space-y-8">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 mb-1">Profile Information</h3>
                <p className="text-sm text-neutral-500">Update your account details and public profile.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.full_name}
                    className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Username</label>
                  <input 
                    type="text" 
                    defaultValue={user?.username}
                    disabled
                    className="w-full p-3 bg-neutral-100 border border-neutral-100 rounded-xl text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Role</label>
                  <input 
                    type="text" 
                    defaultValue={user?.role}
                    disabled
                    className="w-full p-3 bg-neutral-100 border border-neutral-100 rounded-xl text-neutral-500 capitalize cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex justify-end">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-100">
                  <Save className="w-5 h-5" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && (
            <div className="p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                <Settings className="w-10 h-10 text-neutral-300 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Module Under Development</h3>
                <p className="text-neutral-500 max-w-xs mx-auto">This settings module is being prepared for the next system update.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
