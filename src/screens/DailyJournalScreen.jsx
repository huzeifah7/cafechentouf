import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Sun, Moon, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, RefreshCw, FileText, X, Lock } from 'lucide-react';
import { cafeApi } from '../services/cafeApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BottomSheet from '../components/BottomSheet';
import MonthlyInvoiceModal from '../components/MonthlyInvoiceModal';
import { ListSkeleton } from '../components/Skeleton';

export default function DailyJournalScreen() {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const canView = hasPermission('view');

  // Current month default in format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [days, setDays] = useState([]);
  const [monthSummary, setMonthSummary] = useState({
    total_madakhil: 0,
    total_massarif: 0,
    total_arba7: 0,
    days_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedDay, setSelectedDay] = useState(null);
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { days: resDays, monthSummary: resSummary, error } = await cafeApi.getDailyJournal(selectedMonth);
    if (!error) {
      setDays(resDays || []);
      setMonthSummary(resSummary || { total_madakhil: 0, total_massarif: 0, total_arba7: 0, days_count: 0 });
    } else {
      showToast('تعذر تحميل بيانات اليوميات', 'error');
    }
    setLoading(false);
  }, [canView, selectedMonth, showToast]);

  useEffect(() => {
    if (!canView) {
      return;
    }
    let active = true;
    const fetchInitial = async () => {
      const { days: resDays, monthSummary: resSummary } = await cafeApi.getDailyJournal(selectedMonth);
      if (active) {
        setDays(resDays || []);
        setMonthSummary(resSummary || { total_madakhil: 0, total_massarif: 0, total_arba7: 0, days_count: 0 });
        setLoading(false);
      }
    };
    fetchInitial();
    return () => {
      active = false;
    };
  }, [canView, selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  // Format month name in Arabic
  const formatArabicMonth = (monthStr) => {
    try {
      const [y, m] = monthStr.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return new Intl.DateTimeFormat('ar-MA', { month: 'long', year: 'numeric' }).format(d);
    } catch {
      return monthStr;
    }
  };

  // Format date in Arabic
  const formatArabicDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-MA', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const handleOpenDay = (day) => {
    setSelectedDay(day);
    setDaySheetOpen(true);
  };

  if (!canView) {
    return (
      <div className="w-full pb-32 animate-fade-in pt-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center my-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            صلاحية العرض (View) غير مفعلة
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            حسابك لا يملك صلاحية الاطلاع على تقارير اليوميات والأرباح الشهرية. يرجى التواصل مع إدارة المقهى.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-32 animate-fade-in">
      {/* 1. Month Selector Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2 mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-90 cursor-pointer"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-amber-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-black text-white focus:outline-none cursor-pointer text-center"
          />
          <span className="text-xs font-bold text-amber-400">
            ({formatArabicMonth(selectedMonth)})
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-90 cursor-pointer"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Monthly Grand Profit Card (مجموع أرباح هذا الشهر) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl mb-3 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400">
            مجموع أرباح شهر {formatArabicMonth(selectedMonth)}:
          </span>
          <button
            type="button"
            onClick={loadData}
            className="p-1 rounded-lg text-slate-500 hover:text-amber-400 active:scale-90 transition"
            title="تحديث"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Big Net Profit Display */}
        <div className="flex items-baseline gap-2 mb-3">
          <span
            className={`text-3xl font-black tracking-tight ${
              monthSummary.total_arba7 >= 0 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {monthSummary.total_arba7 >= 0 ? '+' : ''}
            {monthSummary.total_arba7.toFixed(2)}
          </span>
          <span className="text-xs font-semibold text-slate-400">درهم مغربي</span>
        </div>

        {/* 2 Mini Stats: Madakhil & Massarif of Month */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/70 rounded-xl p-2 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">إجمالي المداخيل</span>
            <span className="font-bold text-emerald-400">
              +{monthSummary.total_madakhil.toFixed(2)} د.م.
            </span>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-2 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">إجمالي المصاريف</span>
            <span className="font-bold text-rose-400">
              -{monthSummary.total_massarif.toFixed(2)} د.م.
            </span>
          </div>
        </div>

        {/* 3. Button: "تحميل فاتورة هذا الشهر" */}
        <div className="mt-3.5 pt-1">
          <button
            type="button"
            onClick={() => setInvoiceModalOpen(true)}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>تحميل فاتورة هذا الشهر ({formatArabicMonth(selectedMonth)})</span>
          </button>
        </div>
      </div>

      {/* 4. Days Section Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <h3 className="text-sm font-black text-white">سجل الأيام ({days.length} يوم)</h3>
        <span className="text-[11px] text-slate-400">
          اضغط على أي يوم للتفاصيل
        </span>
      </div>

      {/* 5. Listing of Each Day */}
      {loading ? (
        <ListSkeleton count={4} />
      ) : days.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center my-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">لا توجد عمليات في هذا الشهر</h4>
          <p className="text-xs text-slate-400">
            اختر شهراً آخر أو أضف مداخيل ومصاريف من شاشة المصاريف.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {days.map((day) => {
            const isProfit = day.total_arba7 >= 0;

            return (
              <div
                key={day.date}
                onClick={() => handleOpenDay(day)}
                className="bg-slate-900/85 border border-slate-800/90 hover:border-slate-700 rounded-3xl p-3.5 shadow-sm active:scale-[0.99] transition cursor-pointer"
              >
                {/* Header row: Date + Total Day Arba7 badge */}
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {formatArabicDate(day.date)}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {day.date} • {day.all_items.length} عملية
                      </span>
                    </div>
                  </div>

                  {/* Total Arba7 badge */}
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block mb-0.5">أرباح اليوم</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                        isProfit
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                      }`}
                    >
                      {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {day.total_arba7.toFixed(2)} د.م.
                    </span>
                  </div>
                </div>

                {/* 2 Shifts Breakdown Cards: Shift 1 & Shift 2 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Shift 1 (صباح) */}
                  <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-2.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mb-1">
                      <Sun className="w-3.5 h-3.5" />
                      <span>الوردية 1 (صباح)</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">مداخيل:</span>
                        <span className="text-emerald-400 font-bold">+{day.shift1.madakhil}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">مصاريف:</span>
                        <span className="text-rose-400 font-bold">-{day.shift1.massarif}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                        <span>أرباح 1:</span>
                        <span className={day.shift1.arba7 >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                          {day.shift1.arba7} د.م.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shift 2 (ليل) */}
                  <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-2.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 mb-1">
                      <Moon className="w-3.5 h-3.5" />
                      <span>الوردية 2 (ليل)</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">مداخيل:</span>
                        <span className="text-emerald-400 font-bold">+{day.shift2.madakhil}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">مصاريف:</span>
                        <span className="text-rose-400 font-bold">-{day.shift2.massarif}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                        <span>أرباح 2:</span>
                        <span className={day.shift2.arba7 >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                          {day.shift2.arba7} د.م.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span>المداخيل: <b className="text-emerald-400">+{day.total_madakhil}</b> | المصاريف: <b className="text-rose-400">-{day.total_massarif}</b></span>
                  <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                    التفاصيل
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Day Details Bottom Sheet Modal */}
      <BottomSheet
        isOpen={daySheetOpen}
        onClose={() => setDaySheetOpen(false)}
        title={selectedDay ? `تفاصيل يوم ${selectedDay.date}` : 'التفاصيل'}
      >
        {selectedDay && (
          <div className="space-y-4 text-right">
            {/* Grand Day Summary Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                <span>ملخص أرباح اليوم الكامل:</span>
                <span className="text-slate-200">{selectedDay.date}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">مجموع المداخيل</span>
                  <span className="font-black text-emerald-400 text-sm">
                    +{selectedDay.total_madakhil.toFixed(2)} د.م.
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">مجموع المصاريف</span>
                  <span className="font-black text-rose-400 text-sm">
                    -{selectedDay.total_massarif.toFixed(2)} د.م.
                  </span>
                </div>
              </div>

              {/* Total Arba7 = Arba7 1 + Arba7 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-black">
                <span className="text-amber-300">مجموع الأرباح (أرباح 1 + 2):</span>
                <span
                  className={`text-base font-black ${
                    selectedDay.total_arba7 >= 0 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {selectedDay.total_arba7 >= 0 ? '+' : ''}
                  {selectedDay.total_arba7.toFixed(2)} د.م.
                </span>
              </div>
            </div>

            {/* Shift 1 Detailed Section */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                  <Sun className="w-4 h-4" />
                  <span>الوردية 1 (صباح)</span>
                </div>
                <span className="text-xs font-black text-amber-400">
                  أرباح الوردية 1: {selectedDay.shift1.arba7.toFixed(2)} د.م.
                </span>
              </div>

              {/* Shift 1 Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs text-center">
                <div className="bg-slate-900 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">مداخيل الوردية 1</span>
                  <span className="font-bold text-emerald-400">+{selectedDay.shift1.madakhil} د.م.</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">مصاريف الوردية 1</span>
                  <span className="font-bold text-rose-400">-{selectedDay.shift1.massarif} د.م.</span>
                </div>
              </div>

              {/* Shift 1 Itemized list */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  عمليات الوردية 1 ({selectedDay.shift1.items.length}):
                </span>
                {selectedDay.shift1.items.length === 0 ? (
                  <p className="text-[11px] text-slate-500 py-1">لا توجد عمليات مسجلة في الوردية 1.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDay.shift1.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 text-xs border border-slate-800/60"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block">{it.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {it.server_name} {it.note && `• ${it.note}`}
                          </span>
                        </div>
                        <span
                          className={`font-black ${
                            it.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {it.type === 'income' ? `+${it.amount}` : `-${it.amount}`} د.م.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shift 2 Detailed Section */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400">
                  <Moon className="w-4 h-4" />
                  <span>الوردية 2 (ليل)</span>
                </div>
                <span className="text-xs font-black text-indigo-300">
                  أرباح الوردية 2: {selectedDay.shift2.arba7.toFixed(2)} د.م.
                </span>
              </div>

              {/* Shift 2 Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs text-center">
                <div className="bg-slate-900 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">مداخيل الوردية 2</span>
                  <span className="font-bold text-emerald-400">+{selectedDay.shift2.madakhil} د.م.</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">مصاريف الوردية 2</span>
                  <span className="font-bold text-rose-400">-{selectedDay.shift2.massarif} د.م.</span>
                </div>
              </div>

              {/* Shift 2 Itemized list */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  عمليات الوردية 2 ({selectedDay.shift2.items.length}):
                </span>
                {selectedDay.shift2.items.length === 0 ? (
                  <p className="text-[11px] text-slate-500 py-1">لا توجد عمليات مسجلة في الوردية 2.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDay.shift2.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 text-xs border border-slate-800/60"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block">{it.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {it.server_name} {it.note && `• ${it.note}`}
                          </span>
                        </div>
                        <span
                          className={`font-black ${
                            it.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {it.type === 'income' ? `+${it.amount}` : `-${it.amount}`} د.م.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Close Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDaySheetOpen(false)}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
                <span>إغلاق التفاصيل</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 7. Monthly Invoice Modal Preview */}
      <MonthlyInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        selectedMonth={selectedMonth}
        monthSummary={monthSummary}
        days={days}
      />
    </div>
  );
}
