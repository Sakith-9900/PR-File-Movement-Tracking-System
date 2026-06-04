import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import { 
  FileText, 
  Calendar, 
  User, 
  ChevronRight,
  UserPlus,
  Eye,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PRFileCard({ prFile, onAssign, onDelete, isLeader, showAssignButton = true }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 transition-all hover:shadow-sm hover:border-slate-300 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{prFile.pr_number}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">{prFile.contract_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={prFile.status} />
          <StatusBadge status={prFile.priority} />
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-4 flex-1">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Created: {format(new Date(prFile.pr_date), "MMM d, yyyy")}</span>
        </div>
        {prFile.current_holder_code && (
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <span>Current Holder: <span className="font-medium">{prFile.current_holder_code}</span></span>
          </div>
        )}
        {prFile.contract_reference && (
          <div className="flex items-center gap-2 text-slate-600">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Ref: {prFile.contract_reference}</span>
          </div>
        )}
      </div>

      {prFile.description && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{prFile.description}</p>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {showAssignButton && prFile.status !== "Closed" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAssign(prFile)}
              className="text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Assign
            </Button>
          )}
          {/* Delete button — leader = direct delete, worker = request */}
          {onDelete && prFile.status !== "Closed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(prFile)}
              className={cn(
                "text-xs",
                isLeader
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-amber-200 text-amber-700 hover:bg-amber-50"
              )}
            >
              {isLeader ? (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </>
              ) : (
                <>
                  <TriangleAlert className="w-3.5 h-3.5 mr-1" />
                  Request Delete
                </>
              )}
            </Button>
          )}
        </div>
        <Link to={createPageUrl("PRFileDetails") + `?id=${prFile.id}`}>
          <Button variant="ghost" size="sm" className="text-xs">
            <Eye className="w-3.5 h-3.5 mr-1" />
            View Details
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}