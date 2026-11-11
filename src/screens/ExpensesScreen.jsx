import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Sun,
  Moon,
  User,
  CheckCircle2,
  X,
  Edit2,
  Lock,
  Clock,
} from 'lucide-react';
import { cafeApi, getLocalDateStr } from '../services/cafeApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BottomSheet from '../components/BottomSheet';
import ConfirmModal from '../components/ConfirmModal';
import { ListSkeleton } from '../components/Skeleton';

export default function ExpensesScreen({ server: activeServer, period: activePeriod }) {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const canView = hasPermission('view');
  const canAdd = hasPermission('add');
  const canEdit = hasPermission('edit');
  const canDelete = hasPermission('delete');

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null); // null = new, string = edit
  const [formType, setFormType] = useState('expense'); // 'expense' | 'income'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [shift, setShift] = useState(() => (activePeriod === 'ليل' ? '2' : '1'));
  const [serverName, setServerName] = useState(() => activeServer || 'ياسين');
  const [date, setDate] = useState(() => getLocalDateStr());
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Track current 24h local day so screen clears automatically at midnight
  const [todayStr, setTodayStr] = useState(() => getLocalDateStr());

  // Filter state: 'all' | 'income' | 'expense'
  const [filterType, setFilterType] = useState('all');

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  const loadData = useCallback(async (silent = false) => {
    if (!canView) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await cafeApi.getTransactions();
    if (!error) {
      setTransactions(data || []);
    } else if (!silent) {
      showToast('تعذر تحميل العمليات', 'error');
    }
    if (!silent) setLoading(false);
  }, [canView, showToast]);

  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      if (!canView) {
        setLoading(false);
        return;
      }
      const { data } = await cafeApi.getTransactions();
      if (active) {
        setTransactions(data || []);
        setLoading(false);
      }
    };
    fetchInitial();
    return () => {
      active = false;
    };
  }, [canView]);

  // Auto-rollover every 24h (midnight local time) & refresh when app resumes
  useEffect(() => {
    const syncCurrentDay = () => {
      const currentDay = getLocalDateStr();
      setTodayStr((prev) => (prev === currentDay ? prev : currentDay));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCurrentDay();
        if (canView) {
          loadData(true);
        }
      }
    };

    const intervalId = setInterval(syncCurrentDay, 30000);
    window.addEventListener('focus', syncCurrentDay);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', syncCurrentDay);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canView, loadData]);

  // Keep ONLY current 24h day transactions on this page; older history remains saved in Daily Journal (اليوميات)
  const todayTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === todayStr);
  }, [transactions, todayStr]);

  // Today calculations
  const todayStats = useMemo(() => {
    const madakhil = todayTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const massarif = todayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const safi = madakhil - massarif;
    return { madakhil, massarif, safi };
  }, [todayTransactions]);

  // Filtered transactions (strictly current 24h day)
  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return todayTransactions;
    return todayTransactions.filter((t) => t.type === filterType);
  }, [todayTransactions, filterType]);

  // Quick suggestions
  const expenseSuggestions = [
    'حليب (جودة / سنترال)',
    'سكر',
    'خبز / كرواصة',
    'قهوة حبوب',
    'نعناع وأعشاب',
    'قنينة غاز',
    'مواد تنظيف',
    'فواكه للعصير',
  ];

  const incomeSuggestions = [
    'مدخول الصندوق (الكاش)',
    'مبيعات المشروبات',
    'مدخول إضافي',
    'تسوية الحساب',
  ];

  // Open Add Income Modal
  const handleOpenAddIncome = () => {
    if (!canAdd) {
      showToast('ليس لديك صلاحية إضافة العمليات (Add)', 'error');
      return;
    }
    setEditingTxId(null);
    setFormType('income');
    setTitle('');
    setAmount('');
    setShift(activePeriod === 'ليل' ? '2' : '1');
    setServerName(activeServer || 'ياسين');
    setDate(getLocalDateStr());
    setDescription('');
    setSheetOpen(true);
  };

  // Open Add Expense Modal
  const handleOpenAddExpense = () => {
    if (!canAdd) {
      showToast('ليس لديك صلاحية إضافة العمليات (Add)', 'error');
      return;
    }
    setEditingTxId(null);
    setFormType('expense');
    setTitle('');
    setAmount('');
    setShift(activePeriod === 'ليل' ? '2' : '1');
    setServerName(activeServer || 'ياسين');
    setDate(getLocalDateStr());
    setDescription('');
    setSheetOpen(true);
  };

  // Open Edit Transaction Modal
  const handleOpenEdit = (tx) => {
    if (!canEdit) {
      showToast('ليس لديك صلاحية تعديل العمليات (Edit)', 'error');
      return;
    }
    setEditingTxId(tx.id);
    setFormType(tx.type || 'expense');
    setTitle(tx.title || '');
    setAmount(String(tx.amount || ''));
    setShift(tx.shift || '1');
    setServerName(tx.server_name || activeServer || 'ياسين');
    setDate(tx.date || getLocalDateStr());
    setDescription(tx.note || '');
    setSheetOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('يرجى كتابة عنوان أو بيان العملية', 'error');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      type: formType,
      title: title.trim(),
      amount: numAmount,
      date: date || todayStr,
      shift: shift || '1',
      server_name: serverName || 'ياسين',
      description: description.trim(),
    };

    let result;
    if (editingTxId) {
      result = await cafeApi.updateTransaction(editingTxId, payload);
    } else {
      result = await cafeApi.addTransaction(payload);
    }
    setSaving(false);

    if (result.error) {
      showToast('حدث خطأ أثناء الحفظ: ' + result.error.message, 'error');
    } else {
      const isTodayEntry = (payload.date || todayStr) === todayStr;
      showToast(
        editingTxId
          ? isTodayEntry
            ? 'تم تعديل العملية بنجاح'
            : `تم نقل العملية إلى سجل اليوميات (${payload.date})`
          : isTodayEntry
          ? formType === 'income'
            ? 'تم تسجيل المدخول بنجاح'
            : 'تم تسجيل المصروف بنجاح'
          : `تم الحفظ في سجل اليوميات ليوم ${payload.date}`,
        'success'
      );
      setSheetOpen(false);
      loadData();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    if (!canDelete) {
      showToast('ليس لديك صلاحية حذف العمليات (Delete)', 'error');
      return;
    }
    const { error } = await cafeApi.deleteTransaction(txToDelete.id);
    if (error) {
      showToast('تعذر حذف العملية: ' + error.message, 'error');
    } else {
      showToast('تم الحذف بنجاح', 'info');
      loadData();
    }
    setTxToDelete(null);
  };

  return (
    <div className="w-full pb-32 animate-fade-in">
      {/* 2 Main Action Buttons at the very top for lightning-fast thumb access */}
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        {/* Button 1: إضافة مدخول (Income) */}
        <button
          type="button"
          onClick={handleOpenAddIncome}
          disabled={!canAdd}
          className={`min-h-[50px] py-3 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer active:scale-[0.98] ${
            canAdd
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-950/40'
              : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            {canAdd ? <Plus className="w-4 h-4 stroke-[3]" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
          <span>إضافة مدخول</span>
        </button>

        {/* Button 2: إضافة مصروف (Expense) */}
        <button
          type="button"
          onClick={handleOpenAddExpense}
          disabled={!canAdd}
          className={`min-h-[50px] py-3 px-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer active:scale-[0.98] ${
            canAdd
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-950/40'
              : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60 shadow-none'
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            {canAdd ? <Minus className="w-4 h-4 stroke-[3]" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
          <span>إضافة مصروف</span>
        </button>
      </div>

      {/* ACCESS RESTRICTION IF NO VIEW PERMISSION */}
      {!canView ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center my-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            صلاحية العرض (View) غير مفعلة
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            حسابك لا يملك صلاحية الاطلاع على المداخيل والمصاريف المالية. يرجى التواصل مع إدارة المقهى لمنحك الصلاحية.
          </p>
        </div>
      ) : (
        <>
          {/* Today's 3 Key Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-3.5 text-center">
            {/* Madakhil Today */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-0.5">
                <ArrowDownLeft className="w-3 h-3" />
                مداخيل اليوم
              </span>
              <div className="text-base font-black text-emerald-400 mt-1">
                +{todayStats.madakhil.toFixed(0)}{' '}
                <span className="text-[10px] text-slate-500">د.م.</span>
              </div>
            </div>

            {/* Massarif Today */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-400 flex items-center justify-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                مصاريف اليوم
              </span>
              <div className="text-base font-black text-rose-400 mt-1">
                -{todayStats.massarif.toFixed(0)}{' '}
                <span className="text-[10px] text-slate-500">د.م.</span>
              </div>
            </div>

            {/* Safi / Arba7 Today */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-300">أرباح اليوم</span>
              <div
                className={`text-base font-black mt-1 ${
                  todayStats.safi >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {todayStats.safi >= 0 ? '+' : ''}
                {todayStats.safi.toFixed(0)}{' '}
                <span className="text-[10px] text-slate-500">د.م.</span>
              </div>
            </div>
          </div>

          {/* 24h Cycle Indicator */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 mb-3 text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>سجل اليوم (24 ساعة)</span>
              <span className="text-slate-500 font-normal">• {todayStr}</span>
            </span>
            <span className="text-slate-400 shrink-0">
              الأرشيف في <strong className="text-amber-400">اليوميات</strong>
            </span>
          </div>

          {/* Filter Tabs & Count */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  filterType === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  filterType === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                المداخيل
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  filterType === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                المصاريف
              </button>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {filteredTransactions.length} عملية اليوم
            </span>
          </div>

          {/* Transaction List */}
          {loading ? (
            <ListSkeleton count={4} />
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center my-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">لا توجد عمليات مسجلة اليوم</h4>
              <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                {canAdd
                  ? 'هذه الصفحة تعرض مصاريف ومداخيل اليوم (24 ساعة) فقط، والعمليات السابقة محفوظة تلقائياً في تبويب اليوميات.'
                  : 'لا توجد عمليات مسجلة اليوم، وليس لديك صلاحية الإضافة حالياً.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition shadow-sm ${
                      isIncome
                        ? 'bg-slate-900/80 border-emerald-900/40 hover:border-emerald-700/60'
                        : 'bg-slate-900/80 border-rose-900/40 hover:border-rose-700/60'
                    }`}
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            isIncome
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isIncome ? 'مدخول' : 'مصروف'}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100 truncate">
                          {tx.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="font-medium text-slate-400">{tx.date}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 bg-slate-950 px-2 py-0.5 rounded-md">
                          {tx.shift === '2' ? (
                            <>
                              <Moon className="w-3 h-3 text-indigo-400" /> الوردية 2
                            </>
                          ) : (
                            <>
                              <Sun className="w-3 h-3 text-amber-400" /> الوردية 1
                            </>
                          )}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                          {tx.server_name}
                        </span>
                        {tx.note && (
                          <span className="text-slate-400 truncate max-w-[130px]">
                            • {tx.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount & Actions (Edit & Delete based on permissions) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`text-left font-black text-base ml-1 ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`}{' '}
                        <span className="text-[10px] font-semibold text-slate-500">د.م.</span>
                      </div>

                      {/* Edit Button (Visible if canEdit) */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(tx)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 active:scale-90 transition cursor-pointer"
                          title="تعديل العملية"
                          aria-label={`تعديل ${tx.title}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Button (Visible if canDelete) */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setTxToDelete(tx);
                            setDeleteModalOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition cursor-pointer"
                          aria-label={`حذف ${tx.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bottom Sheet for adding / editing Expense or Income */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={
          editingTxId
            ? formType === 'income'
              ? 'تعديل المدخول'
              : 'تعديل المصروف'
            : formType === 'income'
            ? 'إضافة مدخول جديد'
            : 'إضافة مصروف جديد'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick suggestions based on type */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اقتراحات سريعة
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(formType === 'income' ? incomeSuggestions : expenseSuggestions).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTitle(sug)}
                  className={`text-xs px-2.5 py-1 rounded-xl border transition ${
                    title === sug
                      ? formType === 'income'
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                        : 'bg-rose-600 text-white border-rose-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {formType === 'income' ? 'عنوان / بيان المدخول *' : 'عنوان / بيان المصروف *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                formType === 'income'
                  ? 'مثال: مدخول الصندوق، مبيعات...'
                  : 'مثال: حليب، سكر، غاز، قهوة...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              المبلغ بالدرهم (د.م.) *
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Shift Selection: الوردية 1 vs الوردية 2 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              الوردية (الفترة) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShift('1')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  shift === '1'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>الوردية 1 (صباح)</span>
              </button>

              <button
                type="button"
                onClick={() => setShift('2')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  shift === '2'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>الوردية 2 (ليل)</span>
              </button>
            </div>
          </div>

          {/* Waiter Selection & Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الخادم / المسؤول
              </label>
              <select
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ياسين">ياسين</option>
                <option value="مختار">مختار</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                التاريخ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ملاحظة (اختياري)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="تفاصيل إضافية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Submit & Cancel buttons */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="col-span-1 min-h-[50px] py-3.5 px-3 rounded-2xl font-bold text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 active:scale-[0.98] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              aria-label="إلغاء وتراجع"
            >
              <X className="w-4 h-4" />
              <span>إلغاء</span>
            </button>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className={`col-span-2 min-h-[50px] py-3.5 px-4 rounded-2xl font-black text-sm active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-60 text-white ${
                formType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
              }`}
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {editingTxId
                      ? 'حفظ التعديلات'
                      : formType === 'income'
                      ? 'حفظ المدخول'
                      : 'حفظ المصروف'}
                  </span>
                </>
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
        title="حذف العملية"
        message={`هل أنت متأكد من حذف "${txToDelete?.title}" بمبلغ ${txToDelete?.amount} د.م.؟`}
        confirmText="تأكيد الحذف"
      />
    </div>
  );
}
