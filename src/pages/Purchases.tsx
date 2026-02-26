import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Plus, Search, Calendar, DollarSign, FileText, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export default function Purchases() {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    items: [] as any[],
    total_amount: 0
  });

  const [newItem, setNewItem] = useState({
    medicine_id: '',
    batch_number: '',
    expiry_date: '',
    mfg_date: '',
    quantity: 0,
    purchase_rate: 0,
    mrp: 0,
    selling_rate: 0,
    tax_percent: 12
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [m, s, p] = await Promise.all([
        apiFetch('/medicines'),
        apiFetch('/suppliers'),
        apiFetch('/purchases')
      ]);
      setMedicines(m);
      setSuppliers(s);
      setPurchases(p);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => {
    if (!newItem.medicine_id || !newItem.batch_number || newItem.quantity <= 0) return;
    const items = [...formData.items, newItem];
    const total = items.reduce((acc, item) => acc + (item.quantity * item.purchase_rate), 0);
    setFormData({ ...formData, items, total_amount: total });
    setNewItem({
      medicine_id: '', batch_number: '', expiry_date: '', mfg_date: '',
      quantity: 0, purchase_rate: 0, mrp: 0, selling_rate: 0, tax_percent: 12
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return;
    try {
      await apiFetch('/purchases', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ supplier_id: '', invoice_number: '', items: [], total_amount: 0 });
      fetchData();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Purchase Invoices</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> New Purchase
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Invoice #</th>
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {purchases.map((p: any) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {new Date(p.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-neutral-900">{p.invoice_number}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{p.supplier_name}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">₹{p.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{p.user_name}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 italic">
                    No purchase records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-xl font-bold text-neutral-900">Record New Purchase</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Supplier</label>
                  <select required value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500 uppercase">Invoice Number</label>
                  <input required value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                <h3 className="font-bold text-sm text-neutral-700 uppercase tracking-widest">Add Item to Invoice</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Medicine</label>
                    <select value={newItem.medicine_id} onChange={e => setNewItem({...newItem, medicine_id: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                      <option value="">Select Medicine</option>
                      {medicines.map((m: any) => <option key={m.id} value={m.id}>{m.brand_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Batch No</label>
                    <input value={newItem.batch_number} onChange={e => setNewItem({...newItem, batch_number: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Expiry Date</label>
                    <input type="date" value={newItem.expiry_date} onChange={e => setNewItem({...newItem, expiry_date: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Quantity</label>
                    <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Purchase Rate</label>
                    <input type="number" value={newItem.purchase_rate} onChange={e => setNewItem({...newItem, purchase_rate: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">MRP</label>
                    <input type="number" value={newItem.mrp} onChange={e => setNewItem({...newItem, mrp: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Selling Rate</label>
                    <input type="number" value={newItem.selling_rate} onChange={e => setNewItem({...newItem, selling_rate: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={addItem} className="w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors">Add Item</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-neutral-700 uppercase tracking-widest">Invoice Items</h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Medicine</th>
                        <th className="px-4 py-2 text-left">Batch</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {formData.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{medicines.find((m: any) => m.id == item.medicine_id)?.brand_name}</td>
                          <td className="px-4 py-2 font-mono">{item.batch_number}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">₹{item.purchase_rate}</td>
                          <td className="px-4 py-2 text-right font-bold">₹{(item.quantity * item.purchase_rate).toFixed(2)}</td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-neutral-400 italic">No items added yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </form>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase font-bold">Total Invoice Amount</p>
                <p className="text-2xl font-black text-emerald-600">₹{formData.total_amount.toFixed(2)}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition-all">Cancel</button>
                <button onClick={handleSubmit} className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">Post Purchase</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const X = ({ className, onClick }: any) => (
  <svg onClick={onClick} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
