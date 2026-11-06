export function CardSkeleton() {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-slate-800 rounded-md w-1/3" />
        <div className="h-4 bg-slate-800 rounded-md w-1/5" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
        <div className="h-4 bg-slate-800 rounded-md w-1/4" />
        <div className="h-9 bg-slate-800 rounded-xl w-28" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
