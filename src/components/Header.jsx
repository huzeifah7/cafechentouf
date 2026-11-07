import { useState } from 'react';
import { Coffee, Sun, Moon, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import ProfileModal from './ProfileModal';

export default function Header({
  server,
  setServer,
  period,
  setPeriod,
}) {
  const { user, signOut } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Format today's date in Arabic (e.g. "الأربعاء، 4 نونبر")
  const todayDate = new Intl.DateTimeFormat('ar-MA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <>
      <header className="sticky top-0 z-30 w-full max-w-md mx-auto bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pt-[max(env(safe-area-inset-top),1.75rem)] pb-3 shadow-md">
        {/* Top row: Cafe Name + User Name Button (Click to edit profile) + Logout Button (with confirm) */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Coffee className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                مقهى شنتوف
              </h1>
              <span className="text-[11px] font-medium text-amber-400/90 leading-tight">
                {todayDate}
              </span>
            </div>
          </div>

          {/* User Name (Clickable to open Profile & Password) & Logout (With Confirmation) */}
          <div className="flex items-center gap-1.5">
            {user?.name && (
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                title="اضغط لتعديل المعلومات وكلمة المرور"
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-slate-900 border border-slate-800 hover:border-amber-500/50 px-2.5 py-1.5 rounded-full transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <User className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="max-w-[110px] truncate">{user.name}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              title="تسجيل الخروج"
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 flex items-center justify-center active:scale-95 transition cursor-pointer"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom row: Compact Selectors for Waiter and Shift Period */}
        <div className="grid grid-cols-2 gap-2">
          {/* Waiter selector (ياسين / مختار) */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-amber-500/70 transition">
            <User className="w-4 h-4 text-amber-400 shrink-0 ml-1.5" />
            <span className="text-[11px] text-slate-400 ml-1 shrink-0">الخادم:</span>
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer appearance-none text-right pr-1"
            >
              <option value="ياسين" className="bg-slate-900 text-white">ياسين</option>
              <option value="مختار" className="bg-slate-900 text-white">مختار</option>
            </select>
          </div>

          {/* Period selector (صباح / ليل) */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-amber-500/70 transition">
            {period === 'صباح' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0 ml-1.5" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 shrink-0 ml-1.5" />
            )}
            <span className="text-[11px] text-slate-400 ml-1 shrink-0">الفترة:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer appearance-none text-right pr-1"
            >
              <option value="صباح" className="bg-slate-900 text-white">صباح</option>
              <option value="ليل" className="bg-slate-900 text-white">ليل</option>
            </select>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={signOut}
        title="تسجيل الخروج"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج من مقهى شنتوف؟"
        confirmText="نعم، تسجيل الخروج"
      />

      {/* Profile & Password Edit Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
