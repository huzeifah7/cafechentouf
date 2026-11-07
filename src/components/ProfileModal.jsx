import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Lock, CheckCircle2, X, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function ProfileDialog({ onClose }) {
  const { user, updateProfile, updatePassword } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'

  // Info state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Lock scroll & handle Escape
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Handle Save Info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('يرجى ملء كافة الحقول', 'error');
      return;
    }

    setSavingInfo(true);
    const res = await updateProfile(name, email);
    setSavingInfo(false);
    if (res.success) {
      onClose();
    }
  };

  // Handle Save Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('يرجى إدخال كلمة المرور الحالية والجديدة', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('كلمة المرور الجديدة وتأكيدها غير متطابقين!', 'error');
      return;
    }

    setSavingPassword(true);
    const res = await updatePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (res.success) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      dir="rtl"
    >
      {/* Backdrop */}
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
        {/* Drag handle */}
        <div
          className="w-full pt-3 pb-1 flex justify-center cursor-pointer select-none"
          onClick={onClose}
          title="اضغط للإغلاق"
        >
          <div className="w-12 h-1.5 bg-slate-600 hover:bg-slate-500 rounded-full transition" />
        </div>

        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">الملف الشخصي</h3>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition text-xs font-bold cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>
        </div>

        {/* Sub-Tabs: Info vs Password */}
        <div className="p-4 pb-2 bg-slate-900 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'info'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>المعلومات الشخصية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'password'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>تغيير كلمة المرور</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-4 pb-6">
          {/* TAB 1: EDIT INFORMATIONS */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الاسم الكامل / اسم النادل *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: ياسين / مختار"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  البريد الإلكتروني (Email) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cafe.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="col-span-1 min-h-[48px] py-3 px-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="col-span-2 min-h-[48px] py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 transition font-black text-slate-950 text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingInfo ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>حفظ تعديلات الحساب</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: EDIT PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الحالية *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة مرور جديدة (4 أحرف أو أرقام فأكثر)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="col-span-1 min-h-[48px] py-3 px-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء</span>
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="col-span-2 min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 transition font-black text-slate-950 text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingPassword ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>تحديث كلمة المرور</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return <ProfileDialog onClose={onClose} />;
}
