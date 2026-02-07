import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, trend, trendUp, className, onClick }) {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl border border-slate-200/60 p-5 transition-all duration-200",
        onClick && "cursor-pointer hover:border-slate-300 hover:shadow-sm",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1 tracking-tight">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs font-medium mt-2",
              trendUp ? "text-emerald-600" : "text-slate-500"
            )}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
}