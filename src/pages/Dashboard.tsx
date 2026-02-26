import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sales, expiry, stock] = await Promise.all([
          apiFetch('/reports/sales'),
          apiFetch('/reports/expiry'),
          apiFetch('/reports/low-stock')
        ]);
        setSalesData(sales);
        setExpiryData(expiry);
        setLowStock(stock);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { 
      label: "Today's Sales", 
      value: `₹${salesData[0]?.total || 0}`, 
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
        <div className="text-sm text-neutral-500">Last updated: {new Date().toLocaleTimeString()}</div>
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

        {/* Inventory Status */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Inventory Alerts</h3>
          <div className="space-y-4">
            {expiryData.slice(0, 5).map((item: any, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <p className="font-semibold text-red-900">{item.brand_name}</p>
                  <p className="text-xs text-red-600">Expires: {item.expiry_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-900">{item.current_qty} units</p>
                  <p className="text-xs text-red-600">Batch: {item.batch_number}</p>
                </div>
              </div>
            ))}
            {expiryData.length === 0 && (
              <div className="text-center py-12 text-neutral-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No immediate expiry alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
