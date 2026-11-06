import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Coffee, Search, Sparkles } from 'lucide-react';
import { cafeApi } from '../services/cafeApi';
import { useToast } from '../context/ToastContext';
import BottomSheet from '../components/BottomSheet';
import ConfirmModal from '../components/ConfirmModal';
import { ListSkeleton } from '../components/Skeleton';

export default function ProductsScreen() {
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('قهوة');
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await cafeApi.getProducts();
    if (!error) {
      setProducts(data || []);
    } else {
      showToast('تعذر تحميل المشروبات', 'error');
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

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Open add sheet
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setCategory('قهوة');
    setSheetOpen(true);
  };

  // Open edit sheet
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setCategory(product.category || 'قهوة');
    setSheetOpen(true);
  };

  // Save product (Add or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم المشروب', 'error');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('يرجى إدخال سعر صالح', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      price: numPrice,
      category: category.trim() || 'عام',
    };

    if (editingProduct) {
      const { error } = await cafeApi.updateProduct(editingProduct.id, payload);
      if (error) {
        showToast('تعذر تعديل المشروب: ' + error.message, 'error');
      } else {
        showToast('تم تعديل المشروب بنجاح', 'success');
        setSheetOpen(false);
        loadProducts();
      }
    } else {
      const { error } = await cafeApi.addProduct(payload);
      if (error) {
        showToast('تعذر إضافة المشروب: ' + error.message, 'error');
      } else {
        showToast('تمت إضافة المشروب بنجاح', 'success');
        setSheetOpen(false);
        loadProducts();
      }
    }
    setSaving(false);
  };

  // Delete product
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    const { error } = await cafeApi.deleteProduct(productToDelete.id);
    if (error) {
      showToast('تعذر حذف المشروب: ' + error.message, 'error');
    } else {
      showToast('تم حذف المشروب بنجاح', 'info');
      loadProducts();
    }
    setProductToDelete(null);
  };

  // Seed default products
  const handleSeed = async () => {
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
    <div className="w-full pb-28 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-lg font-black text-white">قائمة المشروبات</h2>
          <p className="text-xs text-slate-400">إدارة أسعار وأصناف قائمة المقهى</p>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">
          {products.length} مشروب
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن مشروب بالاسم..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-9 pl-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition"
        />
      </div>

      {/* List */}
      {loading ? (
        <ListSkeleton count={6} />
      ) : products.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center my-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Coffee className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">لا توجد مشروبات بعد</h3>
          <p className="text-slate-400 text-xs mb-4">
            يمكنك إضافة مشروبات يدوياً أو تعبئة قائمة المقهى بنقرة واحدة.
          </p>
          <button
            type="button"
            onClick={handleSeed}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4" />
            إضافة المشروبات الشائعة
          </button>
        </div>
      ) : filtered === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          لا يوجد مشروب يطابق هذا البحث
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm hover:border-slate-700 transition"
            >
              {/* Info */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="font-bold text-sm text-slate-100 truncate">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-black text-amber-400">
                    {product.price} <span className="text-[11px] font-semibold text-slate-400">د.م.</span>
                  </span>
                  {product.category && (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons (Touch targets > 48px) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(product)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 active:scale-90 transition"
                  aria-label={`تعديل ${product.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductToDelete(product);
                    setDeleteModalOpen(true);
                  }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition"
                  aria-label={`حذف ${product.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 left-4 z-30">
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-13 px-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition"
          aria-label="إضافة مشروب جديد"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>إضافة مشروب</span>
        </button>
      </div>

      {/* Bottom Sheet Modal for Add / Edit */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingProduct ? 'تعديل المشروب' : 'إضافة مشروب جديد'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المشروب
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: قهوة حليب، نص نص، براد منعنع..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              السعر (بالدرهم المغربي د.م.)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="مثال: 12"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              التصنيف
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['قهوة', 'شاي', 'عصائر', 'مياه ومشروبات غازية', 'مأكولات خفيفة', 'أخرى'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition ${
                    category === cat
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="تصنيف مخصص..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-60"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{editingProduct ? 'حفظ التعديلات' : 'إضافة المشروب للقائمة'}</span>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete confirmation dialog */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="حذف المشروب"
        message={`هل أنت متأكد من حذف "${productToDelete?.name}" من قائمة المشروبات؟`}
        confirmText="حذف نهائي"
      />
    </div>
  );
}
