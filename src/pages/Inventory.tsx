import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Search, Filter, AlertCircle, Calendar, ArrowUpDown, Settings2, X, Edit3, History, Download, Pill, User, Package } from 'lucide-react';
import { format, isAfter, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, near-expiry, low-stock
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [adjustData, setAdjustData] = useState({
    type: 'damage',
    quantity: 0,
    reason: ''
  });

  const [editData, setEditData] = useState({
    expiry_date: '',
    mrp: 0,
    selling_rate: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await apiFetch('/inventory');
      setInventory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const qty = adjustData.type === 'damage' ? -Math.abs(adjustData.quantity) : Math.abs(adjustData.quantity);
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          batch_id: selectedBatch.id,
          type: adjustData.type,
          quantity: qty,
          reason: adjustData.reason
        })
      });
      setShowAdjustModal(false);
      fetchInventory();
      setAdjustData({ type: 'damage', quantity: 0, reason: '' });
    } catch (err) {
      alert(err);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/inventory/${selectedBatch.id}`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      setShowEditModal(false);
      fetchInventory();
    } catch (err) {
      alert(err);
    }
  };

  const openHistory = async (batch: any) => {
    setSelectedBatch(batch);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const data = await apiFetch(`/inventory/${batch.id}/adjustments`);
      setAdjustmentHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Medicine', 'Batch', 'Expiry', 'Current Qty', 'MRP', 'Selling Rate', 'Supplier'];
    const rows = filtered.map((item: any) => [
      item.brand_name,
      item.batch_number,
      item.expiry_date,
      item.current_qty,
      item.mrp,
      item.selling_rate,
      item.supplier_name
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = inventory.filter((item: any) => {
    const matchesSearch = item.brand_name.toLowerCase().includes(search.toLowerCase()) || 
                         item.batch_number.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'near-expiry') {
      return matchesSearch && !isAfter(new Date(item.expiry_date), addDays(new Date(), 90));
    }
    if (filter === 'low-stock') {
      return matchesSearch && item.current_qty < 50;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Batch Inventory</h1>
        <div className="flex gap-2">
          <button 
            onClick={exportCSV}
            className="bg-white border border-neutral-200 text-neutral-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by medicine or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'near-expiry', 'low-stock'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  filter === f 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                    : "bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Medicine</th>
                <th className="px-6 py-4 font-semibold">Batch Info</th>
                <th className="px-6 py-4 font-semibold">Expiry</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Pricing</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((item: any) => {
                const isNearExpiry = !isAfter(new Date(item.expiry_date), addDays(new Date(), 90));
                const isLowStock = item.current_qty < 50;

                return (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-neutral-900">{item.brand_name}</p>
                      <p className="text-xs text-neutral-500">{item.generic_name} - {item.strength}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-neutral-700">{item.batch_number}</p>
                      <p className="text-xs text-neutral-500">Supplier: {item.supplier_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 text-sm ${isNearExpiry ? 'text-red-600 font-bold' : 'text-neutral-600'}`}>
                        <Calendar className="w-4 h-4" />
                        {item.expiry_date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-bold ${isLowStock ? 'text-amber-600' : 'text-neutral-900'}`}>
                        {item.current_qty} / {item.initial_qty}
                      </p>
                      <div className="w-24 h-1.5 bg-neutral-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${(item.current_qty / item.initial_qty) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-neutral-900">₹{item.selling_rate}</p>
                      <p className="text-xs text-neutral-500">MRP: ₹{item.mrp}</p>
                    </td>
                    <td className="px-6 py-4">
                      {isNearExpiry && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded">
                          <AlertCircle className="w-3 h-3" /> Near Expiry
                        </span>
                      )}
                      {!isNearExpiry && isLowStock && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase rounded">
                          <AlertCircle className="w-3 h-3" /> Low Stock
                        </span>
                      )}
                      {!isNearExpiry && !isLowStock && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setSelectedBatch(item); setEditData({ expiry_date: item.expiry_date, mrp: item.mrp, selling_rate: item.selling_rate }); setShowEditModal(true); }}
                          className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600"
                          title="Edit Batch"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedBatch(item); setShowAdjustModal(true); }}
                          className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600"
                          title="Adjust Stock"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openHistory(item)}
                          className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600"
                          title="Adjustment History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-xl font-bold text-neutral-900">Adjust Stock</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-sm font-bold text-neutral-900">{selectedBatch?.brand_name}</p>
                <p className="text-xs text-neutral-500">Batch: {selectedBatch?.batch_number} | Current: {selectedBatch?.current_qty}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Adjustment Type</label>
                <select 
                  value={adjustData.type} 
                  onChange={e => setAdjustData({...adjustData, type: e.target.value})}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="damage">Damage / Loss (Subtract)</option>
                  <option value="return">Return / Found (Add)</option>
                  <option value="audit">Audit Correction</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Quantity</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={adjustData.quantity} 
                  onChange={e => setAdjustData({...adjustData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Reason</label>
                <textarea 
                  required 
                  value={adjustData.reason} 
                  onChange={e => setAdjustData({...adjustData, reason: e.target.value})}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                  placeholder="Explain why this adjustment is being made..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold">Apply Adjustment</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-xl font-bold text-neutral-900">Edit Batch Details</h2>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-sm font-bold text-neutral-900">{selectedBatch?.brand_name}</p>
                <p className="text-xs text-neutral-500">Batch: {selectedBatch?.batch_number}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Expiry Date</label>
                <input 
                  type="date" 
                  required
                  value={editData.expiry_date} 
                  onChange={e => setEditData({...editData, expiry_date: e.target.value})}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase">MRP (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editData.mrp} 
                    onChange={e => setEditData({...editData, mrp: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Selling Rate (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editData.selling_rate} 
                    onChange={e => setEditData({...editData, selling_rate: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Adjustment History</h2>
                <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest">{selectedBatch?.brand_name} - {selectedBatch?.batch_number}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                {loadingHistory ? (
                  <p className="text-center text-neutral-400 py-12">Loading history...</p>
                ) : adjustmentHistory.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No adjustments recorded for this batch</p>
                  </div>
                ) : (
                  adjustmentHistory.map((adj: any) => (
                    <div key={adj.id} className="flex gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        adj.quantity < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {adj.quantity < 0 ? '-' : '+'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-neutral-900 capitalize">{adj.type}</p>
                          <p className="text-xs text-neutral-400">{new Date(adj.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">{adj.reason}</p>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Qty: {Math.abs(adj.quantity)}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> By: {adj.user_name}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-black transition-all">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
