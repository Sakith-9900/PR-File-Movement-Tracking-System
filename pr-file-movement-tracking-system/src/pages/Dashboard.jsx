import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Plus,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { data: prFiles = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["prFiles"],
    queryFn: () => base44.entities.PRFile.list("-created_date"),
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.FileAssignment.list("-created_date"),
  });

  const stats = {
    totalFiles: prFiles.length,
    openFiles: prFiles.filter(f => f.status === "Open").length,
    inProgress: prFiles.filter(f => f.status === "In Progress").length,
    closed: prFiles.filter(f => f.status === "Closed").length,
    pendingReview: prFiles.filter(f => f.status === "Pending Review").length,
    activeEmployees: employees.filter(e => e.is_active !== false).length,
  };

  const recentFiles = prFiles.slice(0, 5);
  const pendingAssignments = assignments.filter(a => a.status === "Assigned" || a.status === "In Progress").slice(0, 5);

  if (loadingFiles || loadingEmployees || loadingAssignments) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Dashboard" 
        subtitle="PR File Movement Tracking System"
      >
        <Link to={createPageUrl("PRFiles")}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New PR File
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Files"
          value={stats.totalFiles}
          icon={FileText}
          trend={`${stats.openFiles} open`}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          trend="Active workflows"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={AlertCircle}
          trend="Awaiting admin"
        />
        <StatCard
          title="Completed"
          value={stats.closed}
          icon={CheckCircle2}
          trend="Closed files"
          trendUp
        />
      </div>

      {/* Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Employees</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.activeEmployees}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Urgent Files</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">
                  {prFiles.filter(f => f.priority === "Urgent" && f.status !== "Closed").length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">This Month</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">
                  {prFiles.filter(f => {
                    const thisMonth = new Date().getMonth();
                    const fileMonth = new Date(f.pr_date).getMonth();
                    return thisMonth === fileMonth;
                  }).length}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Files & Active Assignments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent PR Files</CardTitle>
              <Link to={createPageUrl("PRFiles")}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentFiles.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No PR files yet"
                description="Create your first PR file to get started"
              />
            ) : (
              <div className="space-y-3">
                {recentFiles.map(file => (
                  <Link 
                    key={file.id} 
                    to={createPageUrl("PRFileDetails") + `?id=${file.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{file.pr_number}</p>
                        <p className="text-xs text-slate-500 truncate">{file.contract_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={file.status} />
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Assignments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Active Assignments</CardTitle>
              <Link to={createPageUrl("Reports")}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Reports <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingAssignments.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active assignments"
                description="Assign files to employees to track progress"
              />
            ) : (
              <div className="space-y-3">
                {pendingAssignments.map(assignment => (
                  <div 
                    key={assignment.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-600">{assignment.employee_code}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{assignment.pr_number}</p>
                        <p className="text-xs text-slate-500">{assignment.employee_name}</p>
                      </div>
                    </div>
                    <StatusBadge status={assignment.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}