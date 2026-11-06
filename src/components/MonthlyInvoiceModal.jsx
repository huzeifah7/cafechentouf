import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, X, Coffee, CheckCircle2 } from 'lucide-react';

export default function MonthlyInvoiceModal({ isOpen, onClose, selectedMonth, monthSummary, days }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format month name in Arabic (e.g. نونبر 2026)
  const [year, month] = selectedMonth.split('-');
  const monthDate = new Date(Number(year), Number(month) - 1, 1);
  const arabicMonthName = new Intl.DateTimeFormat('ar-MA', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export as CSV
  const handleDownloadCsv = () => {
    const headers = [
      'التاريخ',
      'مداخيل الوردية 1',
      'مصاريف الوردية 1',
      'أرباح الوردية 1',
      'مداخيل الوردية 2',
      'مصاريف الوردية 2',
      'أرباح الوردية 2',
      'مجموع أرباح اليوم',
    ];

    const rows = days.map((d) => [
      d.date,
      d.shift1.madakhil,
      d.shift1.massarif,
      d.shift1.arba7,
      d.shift2.madakhil,
      d.shift2.massarif,
      d.shift2.arba7,
      d.total_arba7,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fatora_Cafe_Chentouf_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in my-auto">
        {/* Header - Non-printable controls */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">فاتورة أرباح الشهر</h3>
              <span className="text-[11px] text-amber-400 font-semibold">{arabicMonthName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-900 text-slate-100 print:bg-white print:text-black print:p-6">
          {/* Cafe Header */}
          <div className="flex items-start justify-between border-b border-slate-800 print:border-black/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold print:border print:border-black">
                <Coffee className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white print:text-black">
                  مقهى شنتوف • Café Chentouf
                </h2>
                <p className="text-xs text-amber-400 print:text-slate-700 font-bold">
                  فاتورة الحسابات والأرباح الشهرية
                </p>
                <p className="text-[11px] text-slate-400 print:text-slate-500">
                  تاريخ الاستخراج: {new Date().toLocaleDateString('ar-MA')}
                </p>
              </div>
            </div>

            <div className="text-left">
              <span className="inline-block px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 print:bg-slate-100 print:text-black print:border-black/30 text-xs font-bold">
                {arabicMonthName}
              </span>
            </div>
          </div>

          {/* Monthly Grand Summary Box */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-black/20 rounded-2xl p-4 text-center">
            {/* Total Incomes */}
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-600 block mb-0.5">
                مجموع المداخيل
              </span>
              <span className="text-lg font-black text-emerald-400 print:text-emerald-700">
                +{monthSummary.total_madakhil.toFixed(2)} د.م.
              </span>
            </div>

            {/* Total Expenses */}
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-600 block mb-0.5">
                مجموع المصاريف
              </span>
              <span className="text-lg font-black text-rose-400 print:text-rose-700">
                -{monthSummary.total_massarif.toFixed(2)} د.م.
              </span>
            </div>

            {/* Net Profits */}
            <div>
              <span className="text-[11px] text-slate-400 print:text-slate-600 block mb-0.5">
                صافي أرباح الشهر
              </span>
              <span
                className={`text-lg font-black ${
                  monthSummary.total_arba7 >= 0
                    ? 'text-amber-400 print:text-black font-extrabold'
                    : 'text-rose-400 print:text-rose-700'
                }`}
              >
                {monthSummary.total_arba7 >= 0 ? '+' : ''}
                {monthSummary.total_arba7.toFixed(2)} د.م.
              </span>
            </div>
          </div>

          {/* Detailed Days Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 print:text-black mb-2">
              جدول التفاصيل اليومية للورديات ({days.length} يوم مسجل):
            </h4>

            <div className="overflow-x-auto border border-slate-800 print:border-black/30 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-black/20 text-slate-400 print:text-black font-bold">
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5 text-center text-emerald-400 print:text-emerald-800">مداخيل 1</th>
                    <th className="p-2.5 text-center text-rose-400 print:text-rose-800">مصاريف 1</th>
                    <th className="p-2.5 text-center text-amber-400 print:text-black">ربح 1</th>
                    <th className="p-2.5 text-center text-emerald-400 print:text-emerald-800">مداخيل 2</th>
                    <th className="p-2.5 text-center text-rose-400 print:text-rose-800">مصاريف 2</th>
                    <th className="p-2.5 text-center text-amber-400 print:text-black">ربح 2</th>
                    <th className="p-2.5 text-center font-black bg-slate-900/50 print:bg-slate-200">أرباح اليوم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-black/10">
                  {days.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                      <td className="p-2.5 font-medium whitespace-nowrap">{d.date}</td>
                      <td className="p-2.5 text-center text-emerald-400 print:text-emerald-800">+{d.shift1.madakhil}</td>
                      <td className="p-2.5 text-center text-rose-400 print:text-rose-800">-{d.shift1.massarif}</td>
                      <td className="p-2.5 text-center font-bold">{d.shift1.arba7}</td>
                      <td className="p-2.5 text-center text-emerald-400 print:text-emerald-800">+{d.shift2.madakhil}</td>
                      <td className="p-2.5 text-center text-rose-400 print:text-rose-800">-{d.shift2.massarif}</td>
                      <td className="p-2.5 text-center font-bold">{d.shift2.arba7}</td>
                      <td
                        className={`p-2.5 text-center font-black bg-slate-950/60 print:bg-slate-100 ${
                          d.total_arba7 >= 0 ? 'text-amber-400 print:text-black' : 'text-rose-400 print:text-rose-700'
                        }`}
                      >
                        {d.total_arba7 >= 0 ? '+' : ''}
                        {d.total_arba7.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-950 print:bg-slate-100 border-t-2 border-slate-700 print:border-black font-black text-xs">
                    <td className="p-2.5">المجموع الكلي</td>
                    <td className="p-2.5 text-center text-emerald-400 print:text-emerald-800">
                      +{days.reduce((acc, d) => acc + d.shift1.madakhil, 0)}
                    </td>
                    <td className="p-2.5 text-center text-rose-400 print:text-rose-800">
                      -{days.reduce((acc, d) => acc + d.shift1.massarif, 0)}
                    </td>
                    <td className="p-2.5 text-center">
                      {days.reduce((acc, d) => acc + d.shift1.arba7, 0)}
                    </td>
                    <td className="p-2.5 text-center text-emerald-400 print:text-emerald-800">
                      +{days.reduce((acc, d) => acc + d.shift2.madakhil, 0)}
                    </td>
                    <td className="p-2.5 text-center text-rose-400 print:text-rose-800">
                      -{days.reduce((acc, d) => acc + d.shift2.massarif, 0)}
                    </td>
                    <td className="p-2.5 text-center">
                      {days.reduce((acc, d) => acc + d.shift2.arba7, 0)}
                    </td>
                    <td className="p-2.5 text-center text-amber-400 print:text-black text-sm">
                      {monthSummary.total_arba7 >= 0 ? '+' : ''}
                      {monthSummary.total_arba7.toFixed(2)} د.م.
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer signature area */}
          <div className="pt-6 border-t border-slate-800 print:border-black/20 flex justify-between items-center text-xs text-slate-400 print:text-black">
            <div>
              <p className="font-bold text-slate-300 print:text-black mb-1">إدارة مقهى شنتوف</p>
              <p className="text-[10px] text-slate-500">تم التدقيق والمصادقة</p>
            </div>
            <div className="border border-dashed border-slate-700 print:border-black/40 rounded-xl px-6 py-4 text-center">
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mb-1">الختم والتوقيع</span>
              <CheckCircle2 className="w-5 h-5 mx-auto text-amber-500 print:text-black" />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

