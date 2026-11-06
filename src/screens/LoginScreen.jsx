import { useState } from 'react';
import { Coffee, Lock, Mail, User, CheckCircle2, Database, KeyRound, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('يرجى ملء كافة الحقول المطلوبة', 'error');
      return;
    }

    if (isSignUp && !name.trim()) {
      showToast('يرجى إدخال الاسم الكامل', 'error');
      return;
    }

    setLoading(true);
    if (isSignUp) {
      await signUp(name, email, password);
    } else {
      await signIn(email, password);
    }
    setLoading(false);
  };

  const sqlCode = `-- إنشاء جدول المستخدمين users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إيقاف RLS للسماح بالاتصال المباشر من التطبيق
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- إضافة مستخدم افتراضي
INSERT INTO public.users (name, email, password)
VALUES ('مدير المقهى', 'admin@cafe.com', '123456')
ON CONFLICT (email) DO NOTHING;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    showToast('تم نسخ كود SQL إلى الحافظة', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex flex-col justify-center px-5 py-8 animate-fade-in">
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

      {/* Login / Register Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl mb-5 border border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              !isSignUp
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              isSignUp
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name input (only for Sign Up) */}
          {isSignUp && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الاسم الكامل (أو اسم النادل) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: ياسين / مختار / المدير"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-10 pl-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          )}

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
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
                  <span>{isSignUp ? 'تسجيل حساب جديد والدخول' : 'تسجيل الدخول'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick test credentials button */}
        {!isSignUp && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">حساب تجريبي سريع:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@cafe.com');
                setPassword('123456');
              }}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold active:scale-95 transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              ملء بـ admin@cafe.com
            </button>
          </div>
        )}
      </div>

      {/* SQL Setup Helper Accordion */}
      <div className="mt-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSqlHelp(!showSqlHelp)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-amber-400 transition"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <span>كود SQL لإنشاء جدول المستخدمين (Supabase)</span>
          </div>
          <span className="text-[11px] text-amber-400 font-semibold">
            {showSqlHelp ? 'إخفاء' : 'عرض الكود'}
          </span>
        </button>

        {showSqlHelp && (
          <div className="p-4 pt-0 border-t border-slate-800/60 text-right animate-fade-in">
            <p className="text-[11px] text-slate-400 mb-2">
              انسخ هذا الكود والصقه في <b>SQL Editor</b> داخل حسابك على Supabase ثم اضغط <b>Run</b>:
            </p>
            <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto text-left dir-ltr">
              <pre>{sqlCode}</pre>
              <button
                type="button"
                onClick={handleCopySql}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-90 transition flex items-center gap-1 text-[10px]"
                title="نسخ الكود"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-slate-500">
        مقهى شنتوف • الهاتف الذكي (Mobile-First) • Supabase
      </div>
    </div>
  );
}
