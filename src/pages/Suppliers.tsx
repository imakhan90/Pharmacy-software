import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Plus, Search, Mail, Phone, MapPin, Users, Package, X, History, Pill, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierHistory, setSupplierHistory] = useState<any[]>([]);
  const [supplierMedicines, setSupplierMedicines] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    license_number: '',
    payment_terms: 'Net 30'
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await apiFetch('/suppliers');
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiFetch(`/suppliers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/suppliers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      closeModal();
      fetchSuppliers();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await apiFetch(`/suppliers/${id}`, {
        method: 'DELETE'
      });
      fetchSuppliers();
    } catch (err) {
      alert(err);
    }
  };

  const openEditModal = (supplier: any) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      contact_info: supplier.contact_info,
      license_number: supplier.license_number,
      payment_terms: supplier.payment_terms
    });
    setShowModal(true);
  };

  const openHistoryModal = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const [purchases, medicines] = await Promise.all([
        apiFetch(`/suppliers/${supplier.id}/purchases`),
        apiFetch(`/suppliers/${supplier.id}/medicines`)
      ]);
      setSupplierHistory(purchases);
      setSupplierMedicines(medicines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', contact_info: '', license_number: '', payment_terms: 'Net 30' });
  };

  const filtered = suppliers.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Supplier Management</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s: any) => (
          <div key={s.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600 w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-neutral-100 rounded text-neutral-500 uppercase tracking-tighter">
                {s.payment_terms}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{s.name}</h3>
            <div className="space-y-2 text-sm text-neutral-500 mb-6">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> {s.contact_info}
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" /> License: {s.license_number}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => openEditModal(s)}
                className="flex-1 py-2 text-sm font-semibold text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => openHistoryModal(s)}
                className="flex-1 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <History className="w-3 h-3" /> History
              </button>
              <button 
                onClick={() => handleDelete(s.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Supplier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Supplier Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Contact Info</label>
                <input required value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Phone or Email" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">License Number</label>
                <input required value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Payment Terms</label>
                <select value={formData.payment_terms} onChange={e => setFormData({...formData, payment_terms: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Cash</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 60</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold">
                  {editingId ? 'Update Supplier' : 'Save Supplier'}
                </button>
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{selectedSupplier?.name}</h2>
                <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest">Supplier History & Portfolio</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden">
                  <div className="p-4 border-b border-neutral-100 bg-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-neutral-900 text-sm">Purchase History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 text-neutral-500 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Invoice #</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-left">User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {loadingHistory ? (
                          <tr><td colSpan={4} className="p-8 text-center text-neutral-400">Loading history...</td></tr>
                        ) : supplierHistory.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-neutral-400">No purchase records found</td></tr>
                        ) : supplierHistory.map((p: any) => (
                          <tr key={p.id} className="bg-white">
                            <td className="px-4 py-3 text-neutral-600">{new Date(p.timestamp).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-bold text-neutral-900">{p.invoice_number}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">Rs.{p.total_amount.toFixed(2)}</td>
                            <td className="px-4 py-3 text-neutral-500">{p.user_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden">
                  <div className="p-4 border-b border-neutral-100 bg-white flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-neutral-900 text-sm">Medicines Supplied</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {loadingHistory ? (
                      <p className="text-center text-neutral-400 text-sm">Loading portfolio...</p>
                    ) : supplierMedicines.length === 0 ? (
                      <p className="text-center text-neutral-400 text-sm">No medicines linked yet</p>
                    ) : supplierMedicines.map((m: any) => (
                      <div key={m.id} className="p-3 bg-white rounded-lg border border-neutral-200 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center">
                          <Pill className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{m.brand_name}</p>
                          <p className="text-[10px] text-neutral-500">{m.generic_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-black transition-all">Close History</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
