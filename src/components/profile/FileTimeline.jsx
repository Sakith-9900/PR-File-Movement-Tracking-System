import { format } from "date-fns";
import StatusBadge from "@/components/common/StatusBadge";
import { User, Calendar, Clock, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FileTimeline({ assignments }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>No assignment history yet</p>
      </div>
    );
  }

  const sortedAssignments = [...assignments].sort((a, b) => 
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200" />
      
      <div className="space-y-6">
        {sortedAssignments.map((assignment, index) => (
          <div key={assignment.id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0",
              assignment.status === "Completed" 
                ? "bg-emerald-100" 
                : assignment.status === "In Progress"
                  ? "bg-amber-100"
                  : "bg-slate-100"
            )}>
              {assignment.status === "Completed" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <span className="text-sm font-bold text-slate-600">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200/60 p-4 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600">{assignment.employee_code}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{assignment.employee_name}</p>
                    <p className="text-xs text-slate-500">{assignment.employee_code}</p>
                  </div>
                </div>
                <StatusBadge status={assignment.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Assigned: {format(new Date(assignment.assignment_date), "MMM d, yyyy")}</span>
                </div>
                {assignment.start_date && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span>Started: {format(new Date(assignment.start_date), "MMM d, yyyy")}</span>
                  </div>
                )}
                {assignment.end_date && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed: {format(new Date(assignment.end_date), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>

              {assignment.work_remarks && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-600">{assignment.work_remarks}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}