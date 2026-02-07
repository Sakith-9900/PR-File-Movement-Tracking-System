import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, User, Mail, Phone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeeCard({ employee, onEdit }) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200/60 p-5 transition-all hover:shadow-sm hover:border-slate-300",
      !employee.is_active && "opacity-60"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-600">{employee.short_code}</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{employee.full_name}</h3>
            <p className="text-sm text-slate-500">{employee.employee_id}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(employee)} className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        {employee.designation && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>{employee.designation}</span>
          </div>
        )}
        {employee.department && (
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{employee.department}</span>
          </div>
        )}
        {employee.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{employee.email}</span>
          </div>
        )}
        {employee.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{employee.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Badge variant="outline" className={cn(
          "text-xs",
          employee.is_active 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-slate-50 text-slate-600 border-slate-200"
        )}>
          {employee.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );
}