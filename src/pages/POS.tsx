import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import { Search, ShoppingCart, Trash2, User, Phone, CreditCard, Banknote, Wallet, Printer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';

export default function POS() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  const [lastSaleCart, setLastSaleCart] = useState<any[]>([]);
  const [lastSaleTotals, setLastSaleTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
  const [discount, setDiscount] = useState(0);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  useEffect(() => {
    if (search.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const results = await apiFetch(`/pos/search?q=${search}`);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.batch_id === item.id);
    if (existing) {
      if (existing.quantity >= item.current_qty) {
        alert('Cannot add more than available stock');
        return;
      }
      setCart(cart.map(c => c.batch_id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        batch_id: item.id,
        brand_name: item.brand_name,
        generic_name: item.generic_name,
        batch_number: item.batch_number,
        unit_price: item.selling_rate,
        tax_percent: item.tax_percent,
        quantity: 1,
        max_qty: item.current_qty
      }]);
    }
    setSearch('');
    setSearchResults([]);
  };

  const removeFromCart = (batchId: number) => {
    setCart(cart.filter(c => c.batch_id !== batchId));
  };

  const updateQty = (batchId: number, qty: number) => {
    setCart(cart.map(c => {
      if (c.batch_id === batchId) {
        const newQty = Math.max(1, Math.min(qty, c.max_qty));
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const totals = cart.reduce((acc, item) => {
    const subtotal = item.unit_price * item.quantity;
    const tax = subtotal * (item.tax_percent / 100);
    return {
      subtotal: acc.subtotal + subtotal,
      tax: acc.tax + tax,
      total: acc.total + subtotal + tax
    };
  }, { subtotal: 0, tax: 0, total: 0 });

  const finalTotal = Math.max(0, totals.total - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const result = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customer.name,
          customer_phone: customer.phone,
          items: cart.map(item => ({
            batch_id: item.batch_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_amount: item.unit_price * item.quantity * (item.tax_percent / 100),
            discount_amount: 0
          })),
          total_amount: finalTotal,
          tax_amount: totals.tax,
          discount_amount: discount,
          payment_method: paymentMethod
        })
      });
      setLastSaleId(result.saleId);
      setLastSaleCart([...cart]);
      setLastSaleTotals({ ...totals, total: finalTotal });
      setShowInvoice(true);
      setCart([]);
      setCustomer({ name: '', phone: '' });
      setDiscount(0);
    } catch (err) {
      alert(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Left Column: Search & Items */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-6 h-6" />
            <input 
              type="text"
              placeholder="Scan barcode or search medicine name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
              autoFocus
            />
          </div>
          
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-auto"
              >
                {searchResults.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-none text-left"
                  >
                    <div>
                      <p className="font-bold text-neutral-900">{item.brand_name}</p>
                      <p className="text-xs text-neutral-500">{item.generic_name} - {item.strength}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">Batch: {item.batch_number}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded text-red-600">Exp: {item.expiry_date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">Rs.{item.selling_rate}</p>
                      <p className="text-xs text-neutral-400">{item.current_qty} in stock</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" /> Current Cart
            </h3>
            <span className="text-xs font-bold text-neutral-500 uppercase">{cart.length} Items</span>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {cart.map((item) => (
              <div key={item.batch_id} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 group">
                <div className="flex-1">
                  <p className="font-bold text-neutral-900">{item.brand_name}</p>
                  <p className="text-xs text-neutral-500">Batch: {item.batch_number} | Tax: {item.tax_percent}%</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-neutral-200 rounded-lg bg-white overflow-hidden">
                    <button 
                      onClick={() => updateQty(item.batch_id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-neutral-50 text-neutral-600 font-bold border-r border-neutral-200"
                    >-</button>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateQty(item.batch_id, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-sm font-bold outline-none"
                    />
                    <button 
                      onClick={() => updateQty(item.batch_id, item.quantity + 1)}
                      className="px-3 py-1 hover:bg-neutral-50 text-neutral-600 font-bold border-l border-neutral-200"
                    >+</button>
                  </div>
                  <div className="text-right w-24">
                    <p className="font-bold text-neutral-900">Rs.{(item.unit_price * item.quantity).toFixed(2)}</p>
                    <p className="text-[10px] text-neutral-400">Rs.{item.unit_price} / unit</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.batch_id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-50">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Cart is empty</p>
                <p className="text-sm">Search medicines to start billing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Customer & Checkout */}
      <div className="w-96 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> Customer Details
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Customer Name"
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Phone Number"
                  value={customer.phone}
                  onChange={e => setCustomer({...customer, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-neutral-900 mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Cash', icon: Banknote },
                { id: 'Card', icon: CreditCard },
                { id: 'UPI', icon: Wallet },
                { id: 'Bank', icon: Wallet }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    paymentMethod === m.id 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-sm font-bold">{m.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100 space-y-3">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>Rs.{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax Amount</span>
              <span>Rs.{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-neutral-500">
              <span>Discount (Rs.)</span>
              <input 
                type="number" 
                value={discount} 
                onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 text-right bg-neutral-50 border border-neutral-100 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-between text-xl font-black text-neutral-900 pt-2">
              <span>Total Payable</span>
              <span className="text-emerald-600">Rs.{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Processing...' : 'Complete Sale (F12)'}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="font-bold text-neutral-900">Sale Completed</h2>
              <button onClick={() => setShowInvoice(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8" ref={invoiceRef}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-emerald-600">PharmaFlow Pro</h1>
                <p className="text-sm text-neutral-500">123 Medical Street, City Center</p>
                <p className="text-sm text-neutral-500">Phone: +91 98765 43210</p>
                <div className="mt-4 pt-4 border-t border-dashed border-neutral-200">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tax Invoice</p>
                  <p className="text-sm font-bold text-neutral-900">Invoice #{lastSaleId?.toString().padStart(6, '0')}</p>
                  <p className="text-xs text-neutral-500">{new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-6 text-sm">
                <p><span className="text-neutral-400">Customer:</span> <span className="font-bold">{customer.name || 'Walk-in Customer'}</span></p>
                <p><span className="text-neutral-400">Phone:</span> <span className="font-bold">{customer.phone || 'N/A'}</span></p>
              </div>

              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b-2 border-neutral-900 text-left">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {lastSaleCart.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2">
                        <p className="font-bold">{item.brand_name}</p>
                        <p className="text-[10px] text-neutral-400">Batch: {item.batch_number}</p>
                      </td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{item.unit_price}</td>
                      <td className="py-2 text-right">{(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-sm border-t-2 border-neutral-900 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs.{lastSaleTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Rs.{lastSaleTotals.tax.toFixed(2)}</span>
                </div>
                {lastSaleTotals.total < (lastSaleTotals.subtotal + lastSaleTotals.tax) && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-Rs.{(lastSaleTotals.subtotal + lastSaleTotals.tax - lastSaleTotals.total).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg pt-2">
                  <span>Grand Total</span>
                  <span>Rs.{lastSaleTotals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-12 text-center text-[10px] text-neutral-400 uppercase tracking-widest">
                <p>Thank you for your visit!</p>
                <p>Medicines once sold will not be taken back</p>
              </div>
            </div>
            <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
              <button onClick={() => setShowInvoice(false)} className="flex-1 py-3 font-bold text-neutral-600 hover:bg-neutral-200 rounded-xl transition-all">Close</button>
              <button onClick={() => handlePrint()} className="flex-1 py-3 font-bold bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                <Printer className="w-5 h-5" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
