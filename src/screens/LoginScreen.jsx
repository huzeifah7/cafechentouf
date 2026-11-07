import { useState } from 'react';
import { Coffee, Lock, Mail, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('يرجى ملء كافة الحقول المطلوبة', 'error');
      return;
    }

    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex flex-col justify-center px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-8 animate-fade-in">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-3.5 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/30">
          <Coffee className="w-10 h-10 stroke-[2.3]" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          مقهى شنتوف
        </h1>
        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
          Café Chentouf • نظام التدبير اليومي
        </p>
        <p className="text-xs text-slate-400">
          يرجى تسجيل الدخول للوصول إلى لوحة المبيعات والمصاريف
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cafe.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] transition font-black text-slate-950 text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick test credentials button */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">حساب تجريبي سريع:</span>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@cafe.com');
              setPassword('123456');
            }}
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold active:scale-95 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            ملء بـ admin@cafe.com
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-slate-500">
        مقهى شنتوف • الهاتف الذكي (Mobile-First) • Supabase
      </div>
    </div>
  );
}
