import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      dir="rtl"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className="relative z-10 w-full max-w-md bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle area (clicking it closes the modal) */}
        <div
          className="w-full pt-3 pb-1 flex justify-center cursor-pointer select-none"
          onClick={onClose}
          title="اضغط للسحب أو الإغلاق"
        >
          <div className="w-12 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full transition" />
        </div>

        {/* Sticky Header with prominent Close button */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 truncate pr-1">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 active:scale-95 transition cursor-pointer text-xs font-bold shrink-0"
            aria-label="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain pb-8">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
