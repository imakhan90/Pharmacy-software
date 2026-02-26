import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Download, Calendar, Filter, TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetch('/reports/sales');
        setSalesData(data.reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Loading Reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Analytics & Reports</h1>
        <div className="flex gap-2">
          <button className="bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-50 transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Revenue Trends</h3>
                <p className="text-sm text-neutral-500">Daily sales performance</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-600">₹{salesData.reduce((acc, curr: any) => acc + curr.total, 0).toFixed(2)}</p>
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-widest">Total Period Revenue</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Volume */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 mb-6">Transaction Volume</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-xl shadow-emerald-100">
            <TrendingUp className="w-8 h-8 mb-4 opacity-50" />
            <h4 className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-1">Average Order Value</h4>
            <p className="text-3xl font-black">₹{(salesData.reduce((acc, curr: any) => acc + curr.total, 0) / salesData.reduce((acc, curr: any) => acc + curr.count, 0) || 0).toFixed(2)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-4">Top Categories</h3>
            <div className="space-y-4">
              {[
                { label: 'Tablets', value: 45, color: 'bg-emerald-500' },
                { label: 'Syrups', value: 25, color: 'bg-blue-500' },
                { label: 'Injections', value: 15, color: 'bg-amber-500' },
                { label: 'Others', value: 15, color: 'bg-neutral-400' }
              ].map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-neutral-700">{cat.label}</span>
                    <span className="text-neutral-500">{cat.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: `${cat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="font-bold text-neutral-900 mb-4">Recent Milestones</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">Target Reached</p>
                  <p className="text-xs text-neutral-500">Daily sales target of ₹10k achieved</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">Stock Replenished</p>
                  <p className="text-xs text-neutral-500">24 new batches added today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
