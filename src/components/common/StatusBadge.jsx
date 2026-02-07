import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  // PR File statuses
  "Open": "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Review": "bg-purple-50 text-purple-700 border-purple-200",
  "Closed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  // Assignment statuses
  "Assigned": "bg-slate-50 text-slate-700 border-slate-200",
  "Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Returned": "bg-red-50 text-red-700 border-red-200",
  // Priority
  "Low": "bg-slate-50 text-slate-600 border-slate-200",
  "Medium": "bg-blue-50 text-blue-600 border-blue-200",
  "High": "bg-orange-50 text-orange-600 border-orange-200",
  "Urgent": "bg-red-50 text-red-600 border-red-200",
};

export default function StatusBadge({ status, className }) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium text-xs px-2.5 py-0.5",
        statusStyles[status] || "bg-gray-50 text-gray-700 border-gray-200",
        className
      )}
    >
      {status}
    </Badge>
  );
}