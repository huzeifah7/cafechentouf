import { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ExpensesScreen from './screens/ExpensesScreen';
import DailyJournalScreen from './screens/DailyJournalScreen';
import LoginScreen from './screens/LoginScreen';
import { Coffee } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();

  // 2 main tabs: 'expenses' (المصاريف والمداخيل) | 'journal' (اليوميات)
  const [activeTab, setActiveTab] = useState('expenses');

  // Shared Header state: Server & Period
  const [server, setServer] = useState(() => {
    if (user?.name?.includes('مختار')) return 'مختار';
    return 'ياسين';
  });

  const [period, setPeriod] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 16 ? 'ليل' : 'صباح';
  });

  // 1. Loading state
  if (loading) {
    return (
      <div className="app-safe-top min-h-screen w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
          <Coffee className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-slate-300">جاري تحميل مقهى شنتوف...</p>
      </div>
    );
  }

  // 2. Login Page MUST be the first thing if not logged in
  if (!user) {
    return <LoginScreen />;
  }

  // 3. Authenticated App (2 Tabs: Massarif & Yawmiyat)
  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-slate-950 text-slate-100 flex flex-col relative shadow-2xl border-x border-slate-900/80">
      {/* Fixed Compact Mobile Header */}
      <Header
        server={server}
        setServer={setServer}
        period={period}
        setPeriod={setPeriod}
      />

      {/* Screen Body */}
      <main className="flex-1 w-full px-3.5 pt-4">
        {activeTab === 'expenses' && (
          <ExpensesScreen server={server} period={period} />
        )}
        {activeTab === 'journal' && <DailyJournalScreen />}
      </main>

      {/* Fixed Bottom Navigation Bar (2 Tabs) */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
