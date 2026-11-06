import { useState, useEffect, useMemo, useCallback } from 'react';
import { Minus, Plus, RotateCcw, Sparkles, Search, CheckCircle2 } from 'lucide-react';
import { cafeApi } from '../services/cafeApi';
import { useToast } from '../context/ToastContext';
import { ListSkeleton } from '../components/Skeleton';

export default function ShiftClosingScreen({ server, period }) {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [cashGiven, setCashGiven] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [submitting, setSubmitting] = useState(false);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await cafeApi.getProducts();
    if (error) {
      showToast('تعذر تحميل قائمة المشروبات', 'error');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      const { data } = await cafeApi.getProducts();
      if (active) {
        setProducts(data || []);
        setLoading(false);
      }
    };
    fetchInitial();
    return () => {
      active = false;
    };
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Stepper handlers
  const updateQuantity = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const setDirectQuantity = (productId, val) => {
    const num = parseInt(val, 10);
    setQuantities((prev) => {
      if (isNaN(num) || num <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: num };
    });
  };

  const handleReset = () => {
    setQuantities({});
    setCashGiven('');
    showToast('تمت إعادة تعيين العداد', 'info');
  };

  // Calculations
  const theoreticalTotal = useMemo(() => {
    return products.reduce((acc, p) => {
      const qty = quantities[p.id] || 0;
      return acc + qty * (Number(p.price) || 0);
    }, 0);
  }, [products, quantities]);

  const totalItemsCount = useMemo(() => {
    return Object.values(quantities).reduce((acc, q) => acc + q, 0);
  }, [quantities]);

  const cashAmount = parseFloat(cashGiven) || 0;
  const difference = cashAmount - theoreticalTotal;

  // Submit Shift Closing
  const handleSubmitShift = async () => {
    if (totalItemsCount === 0 && cashAmount === 0) {
      showToast('يرجى إدخال المشروبات المباعة أو المبلغ المقبوض', 'error');
      return;
    }

    setSubmitting(true);
    const today = new Date().toISOString().split('T')[0];

    // Prepare items list
    const items = [];
    products.forEach((p) => {
      const qty = quantities[p.id] || 0;
      if (qty > 0) {
        items.push({
          product_id: p.id,
          product_name: p.name,
          quantity: qty,
          price: Number(p.price),
          subtotal: qty * Number(p.price),
        });
      }
    });

    const payload = {
      date: today,
      shift_type: period,
      server_name: server,
      cash_given: cashAmount,
      difference: difference,
      items,
    };

    const { error } = await cafeApi.saveShift(payload);

    setSubmitting(false);

    if (error) {
      showToast('حدث خطأ أثناء حفظ الوردية: ' + error.message, 'error');
    } else {
      let diffMsg = 'الحساب مضبوط بالتمام';
      if (difference > 0) diffMsg = `يوجد فائض: +${difference} د.م.`;
      if (difference < 0) diffMsg = `يوجد عجز: ${difference} د.م.`;

      showToast(`تم إغلاق وردية ${period} (${server}) بنجاح! ${diffMsg}`, 'success', 4500);
      setQuantities({});
      setCashGiven('');
    }
  };

  // Seed Moroccan products if empty
  const handleSeedProducts = async () => {
    setLoading(true);
    const { error } = await cafeApi.seedDefaultProducts();
    if (!error) {
      showToast('تمت إضافة المشروبات الافتراضية بنجاح', 'success');
      loadProducts();
    } else {
      showToast('تعذر إضافة المشروبات: ' + error.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-48 animate-fade-in">
      {/* Category Pills & Search */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث عن مشروب..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-9 pl-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition"
          />
        </div>

        {/* Categories scrollable pill row */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reset button & counts row */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-slate-400 font-medium">
          المشروبات المحددة: <b className="text-amber-400 font-bold">{totalItemsCount}</b>
        </span>
        {totalItemsCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 active:scale-95 transition font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            تصفير
          </button>
        )}
      </div>

      {/* Drinks list */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : products.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center my-6">
          <p className="text-slate-400 text-sm mb-4">قائمة المشروبات فارغة حالياً في قاعدة البيانات.</p>
          <button
            type="button"
            onClick={handleSeedProducts}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4" />
            إضافة المشروبات الشائعة للمقهى
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          لا يوجد مشروب يطابق البحث
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((product) => {
            const qty = quantities[product.id] || 0;
            const subtotal = qty * (Number(product.price) || 0);

            return (
              <div
                key={product.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  qty > 0
                    ? 'bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Product details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-bold text-sm text-slate-100 truncate">
                      {product.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-400/90 font-bold">
                      {product.price} د.م.
                    </span>
                    {product.category && (
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                        {product.category}
                      </span>
                    )}
                    {qty > 0 && (
                      <span className="text-emerald-400 font-bold">
                        = {subtotal} د.م.
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactile Stepper Control (touch targets > 48px) */}
                <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, -1)}
                    disabled={qty === 0}
                    className={`w-11 h-11 flex items-center justify-center rounded-lg transition active:scale-90 ${
                      qty > 0
                        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-900/50 text-slate-600 cursor-not-allowed'
                    }`}
                    aria-label={`إنقاص ${product.name}`}
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={qty === 0 ? '' : qty}
                    onChange={(e) => setDirectQuantity(product.id, e.target.value)}
                    placeholder="0"
                    className="w-12 h-11 text-center bg-transparent font-black text-base text-amber-400 focus:outline-none focus:bg-slate-900 rounded-md transition"
                    aria-label={`كمية ${product.name}`}
                  />

                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-90 transition font-bold shadow-sm shadow-amber-500/20"
                    aria-label={`زيادة ${product.name}`}
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Financial Summary Card */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-3 z-30 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-3.5 shadow-2xl shadow-black/80 space-y-3">
          {/* Row 1: Theoretical Total + Cash Input */}
          <div className="grid grid-cols-2 gap-2">
            {/* Theoretical Total */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                المجموع النظري
              </span>
              <div className="text-xl font-black text-amber-400 tracking-tight">
                {theoreticalTotal} <span className="text-xs font-semibold text-slate-400">د.م.</span>
              </div>
            </div>

            {/* Cash Input */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between focus-within:border-amber-500/80 transition">
              <span className="text-[11px] font-medium text-slate-400">
                المسلم نقداً (كاش)
              </span>
              <div className="flex items-center">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-xl font-black text-white focus:outline-none placeholder-slate-600"
                />
                <span className="text-xs font-semibold text-slate-400 mr-1">د.م.</span>
              </div>
            </div>
          </div>

          {/* Row 2: Live Solde / Difference Status */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition ${
              difference === 0
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : difference > 0
                ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-300'
                : 'bg-rose-950/50 border-rose-700/80 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>الفارق (Solde):</span>
              <span className="text-sm font-black">
                {difference > 0 ? `+${difference.toFixed(2)}` : difference.toFixed(2)} د.م.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-black bg-black/30">
              {difference === 0
                ? 'متوازن (مضبوط)'
                : difference > 0
                ? 'فائض (زائد)'
                : 'عجز (ناقص)'}
            </span>
          </div>

          {/* Validation Button */}
          <button
            type="button"
            onClick={handleSubmitShift}
            disabled={submitting}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] transition font-black text-slate-950 text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>حفظ وإغلاق الوردية ({period} - {server})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
