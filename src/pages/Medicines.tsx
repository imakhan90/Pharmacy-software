import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Plus, Search, Edit2, Trash2, Pill } from 'lucide-react';
import { motion } from 'motion/react';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    generic_name: '',
    strength: '',
    dosage_form: 'Tablet',
    pack_size: '',
    barcode: '',
    manufacturer: '',
    salt_composition: '',
    storage_notes: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await apiFetch('/medicines');
      setMedicines(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiFetch(`/medicines/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/medicines', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      closeModal();
      fetchMedicines();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await apiFetch(`/medicines/${id}`, {
        method: 'DELETE'
      });
      fetchMedicines();
    } catch (err) {
      alert(err);
    }
  };

  const openEditModal = (medicine: any) => {
    setEditingId(medicine.id);
    setFormData({
      brand_name: medicine.brand_name,
      generic_name: medicine.generic_name,
      strength: medicine.strength,
      dosage_form: medicine.dosage_form,
      pack_size: medicine.pack_size,
      barcode: medicine.barcode,
      manufacturer: medicine.manufacturer,
      salt_composition: medicine.salt_composition || '',
      storage_notes: medicine.storage_notes || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      brand_name: '', generic_name: '', strength: '', dosage_form: 'Tablet',
      pack_size: '', barcode: '', manufacturer: '', salt_composition: '', storage_notes: ''
    });
  };

  const filtered = medicines.filter((m: any) => 
    m.brand_name.toLowerCase().includes(search.toLowerCase()) ||
    m.generic_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900">Medicine Master</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Medicine
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search by brand or generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Medicine Details</th>
                <th className="px-6 py-4 font-semibold">Dosage / Pack</th>
                <th className="px-6 py-4 font-semibold">Manufacturer</th>
                <th className="px-6 py-4 font-semibold">Barcode</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((m: any) => (
                <tr key={m.id} className="hover:bg-neutral-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Pill className="text-emerald-600 w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{m.brand_name}</p>
                        <p className="text-xs text-neutral-500">{m.generic_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-700">{m.dosage_form} - {m.strength}</p>
                    <p className="text-xs text-neutral-500">{m.pack_size}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{m.manufacturer}</td>
                  <td className="px-6 py-4 text-sm font-mono text-neutral-500">{m.barcode}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(m)}
                        className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-xl font-bold text-neutral-900">{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Brand Name</label>
                <input required value={formData.brand_name} onChange={e => setFormData({...formData, brand_name: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Generic Name</label>
                <input required value={formData.generic_name} onChange={e => setFormData({...formData, generic_name: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Strength</label>
                <input required value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 500mg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Dosage Form</label>
                <select value={formData.dosage_form} onChange={e => setFormData({...formData, dosage_form: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Injection</option>
                  <option>Ointment</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Pack Size</label>
                <input required value={formData.pack_size} onChange={e => setFormData({...formData, pack_size: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 10x10" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Barcode</label>
                <input required value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-500 uppercase">Manufacturer</label>
                <input required value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold">
                  {editingId ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
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
