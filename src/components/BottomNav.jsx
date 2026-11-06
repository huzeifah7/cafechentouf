import { WalletCards, CalendarDays } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: 'expenses',
      label: 'المصاريف والمداخيل',
      icon: WalletCards,
    },
    {
      id: 'journal',
      label: 'اليوميات',
      icon: CalendarDays,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-8px_25px_rgba(0,0,0,0.5)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-2 px-4 py-2 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[54px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 active:scale-95 relative cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 font-medium hover:bg-slate-900/50'
              }`}
              aria-label={tab.label}
            >
              {/* Active glow pill indicator */}
              {isActive && (
                <span className="absolute -top-1 w-10 h-1 bg-amber-400 rounded-full shadow-[0_0_12px_#f59e0b]" />
              )}
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5] text-amber-400' : 'stroke-2 text-slate-400'
                  }`}
                />
                <span className="text-xs tracking-tight">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
