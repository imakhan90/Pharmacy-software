import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Settings,
  X,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [expiryData, setExpiryData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiryFilter, setExpiryFilter] = useState(30);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationThreshold, setNotificationThreshold] = useState(30);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sales, expiry, stock, notifs, settings] = await Promise.all([
          apiFetch('/reports/sales'),
          apiFetch('/reports/expiry'),
          apiFetch('/reports/low-stock'),
          apiFetch('/notifications'),
          apiFetch('/settings')
        ]);
        setSalesData(sales);
        setExpiryData(expiry);
        setLowStock(stock);
        setNotifications(notifs);
        if (settings.expiry_notification_days) {
          setNotificationThreshold(parseInt(settings.expiry_notification_days));
        }
        
        // Trigger a fresh check for notifications
        await apiFetch('/notifications/check', { method: 'POST' });
        const updatedNotifs = await apiFetch('/notifications');
        setNotifications(updatedNotifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      const updatedNotifs = await apiFetch('/notifications');
      setNotifications(updatedNotifs);
    } catch (err) {
      console.error(err);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'expiry_notification_days', value: notificationThreshold })
      });
      setShowSettings(false);
      // Re-trigger check with new threshold
      await apiFetch('/notifications/check', { method: 'POST' });
      const updatedNotifs = await apiFetch('/notifications');
      setNotifications(updatedNotifs);
    } catch (err) {
      alert(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const stats = [
    { 
      label: "Today's Sales", 
      value: `Rs.${salesData[0]?.total || 0}`, 
      change: "+12.5%", 
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    { 
      label: "Low Stock Items", 
      value: lowStock.length, 
      change: "Needs attention", 
      trend: "down",
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    { 
      label: "Near Expiry", 
      value: expiryData.length, 
      change: "Next 90 days", 
      trend: "down",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    { 
      label: "Pending Orders", 
      value: "8", 
      change: "From suppliers", 
      trend: "up",
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50"
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
              {notifications.filter((n: any) => !n.is_read).length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                >
                  <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 text-sm">Notifications</h3>
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={`p-4 border-b border-neutral-50 last:border-none ${!n.is_read ? 'bg-emerald-50/30' : ''}`}>
                          <p className="text-xs text-neutral-900 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-neutral-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            title="Alert Settings"
          >
            <Settings className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="text-sm text-neutral-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiry Watchlist */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Expiry Watchlist</h3>
              <p className="text-xs text-neutral-500">Monitor batches nearing expiration</p>
            </div>
            <div className="flex bg-neutral-100 p-1 rounded-lg">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setExpiryFilter(days)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    expiryFilter === days 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 space-y-3 overflow-auto max-h-[400px] pr-2 custom-scrollbar">
            {expiryData
              .filter((item: any) => {
                const expiryDate = new Date(item.expiry_date);
                const today = new Date();
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= expiryFilter;
              })
              .map((item: any, i) => {
                const expiryDate = new Date(item.expiry_date);
                const today = new Date();
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let statusColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                if (diffDays <= 30) statusColor = "bg-red-50 text-red-600 border-red-100";
                else if (diffDays <= 60) statusColor = "bg-amber-50 text-amber-600 border-amber-100";

                return (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm ${statusColor}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColor.split(' ')[0]} border border-current opacity-20`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{item.brand_name}</p>
                        <p className="text-[10px] opacity-70 font-mono uppercase tracking-wider">Batch: {item.batch_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{item.current_qty} Units</p>
                      <p className="text-[10px] font-bold uppercase tracking-tighter">
                        {diffDays <= 0 ? 'Expired' : `Expires in ${diffDays} days`}
                      </p>
                    </div>
                  </div>
                );
              })}
            {expiryData.filter((item: any) => {
                const expiryDate = new Date(item.expiry_date);
                const today = new Date();
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= expiryFilter;
              }).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-400 opacity-50">
                <AlertTriangle className="w-12 h-12 mb-2" />
                <p className="text-sm font-medium">No batches expiring in {expiryFilter} days</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Sales Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <h2 className="text-xl font-bold text-neutral-900">Alert Configuration</h2>
                <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Expiry Notification Threshold</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="7" 
                      max="180" 
                      step="1"
                      value={notificationThreshold}
                      onChange={(e) => setNotificationThreshold(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <span className="w-16 text-center font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      {notificationThreshold}D
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">System will generate alerts for batches expiring within {notificationThreshold} days.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Notifications are generated automatically. In a production environment, this would also trigger email alerts to the registered administrator.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2 font-bold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveSettings}
                  disabled={isSavingSettings}
                  className="flex-1 py-2 font-bold bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
