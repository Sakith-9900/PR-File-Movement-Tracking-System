import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  Calendar
} from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: prFiles = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["prFiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from('pr_files').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from('file_assignments').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats = {
    totalFiles: prFiles.length,
    openFiles: prFiles.filter(f => f.status === "Open").length,
    inProgress: prFiles.filter(f => f.status === "In Progress").length,
    pendingReview: prFiles.filter(f => f.status === "Pending Review").length,
    closed: prFiles.filter(f => f.status === "Closed").length,
    activeEmployees: employees.filter(e => e.is_active !== false).length,
  };

  // Status distribution data
  const statusData = [
    { name: "Open", value: stats.openFiles, color: "#3b82f6" },
    { name: "In Progress", value: stats.inProgress, color: "#f59e0b" },
    { name: "Pending Review", value: stats.pendingReview, color: "#8b5cf6" },
    { name: "Closed", value: stats.closed, color: "#10b981" },
  ].filter(d => d.value > 0);

  // Employee workload data
  const employeeWorkload = employees
    .filter(e => e.is_active !== false)
    .map(emp => {
      const empAssignments = assignments.filter(a => a.employee_code === emp.short_code);
      const active = empAssignments.filter(a => a.status === "Assigned" || a.status === "In Progress").length;
      const completed = empAssignments.filter(a => a.status === "Completed").length;
      return {
        name: emp.short_code,
        fullName: emp.full_name,
        active,
        completed,
        total: empAssignments.length,
      };
    })
    .filter(e => e.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Monthly trend data
  const thisMonth = new Date();
  const monthStart = startOfMonth(thisMonth);
  const monthEnd = endOfMonth(thisMonth);
  
  const monthlyFiles = prFiles.filter(f => {
    const fileDate = new Date(f.pr_date);
    return isWithinInterval(fileDate, { start: monthStart, end: monthEnd });
  });

  // Processing time analysis
  const completedAssignments = assignments.filter(a => a.status === "Completed" && a.start_date && a.end_date);
  const avgProcessingTime = completedAssignments.length > 0
    ? Math.round(completedAssignments.reduce((sum, a) => {
        return sum + differenceInDays(new Date(a.end_date), new Date(a.start_date));
      }, 0) / completedAssignments.length)
    : 0;

  // Priority distribution
  const priorityData = [
    { name: "Low", value: prFiles.filter(f => f.priority === "Low" && f.status !== "Closed").length },
    { name: "Medium", value: prFiles.filter(f => f.priority === "Medium" && f.status !== "Closed").length },
    { name: "High", value: prFiles.filter(f => f.priority === "High" && f.status !== "Closed").length },
    { name: "Urgent", value: prFiles.filter(f => f.priority === "Urgent" && f.status !== "Closed").length },
  ].filter(d => d.value > 0);

  if (loadingFiles) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="File movement analysis and performance metrics"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Files"
          value={stats.totalFiles}
          icon={FileText}
        />
        <StatCard
          title="Active Files"
          value={stats.openFiles + stats.inProgress + stats.pendingReview}
          icon={Clock}
        />
        <StatCard
          title="This Month"
          value={monthlyFiles.length}
          icon={Calendar}
        />
        <StatCard
          title="Avg Processing Days"
          value={avgProcessingTime}
          icon={TrendingUp}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employee Workload</TabsTrigger>
          <TabsTrigger value="pending">Pending Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Files by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {employeeWorkload.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No assignment data available
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeWorkload} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={60} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border">
                                <p className="font-medium">{data.fullName}</p>
                                <p className="text-sm text-slate-500">Code: {data.name}</p>
                                <p className="text-sm text-amber-600">Active: {data.active}</p>
                                <p className="text-sm text-emerald-600">Completed: {data.completed}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="active" stackId="a" fill="#f59e0b" name="Active" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Files by Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeWorkload
                  .filter(e => e.active > 0)
                  .sort((a, b) => b.active - a.active)
                  .map(emp => (
                    <div key={emp.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-600">{emp.name}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{emp.fullName}</p>
                          <p className="text-xs text-slate-500">{emp.total} total assignments</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-600">{emp.active}</p>
                        <p className="text-xs text-slate-500">pending</p>
                      </div>
                    </div>
                  ))}
                {employeeWorkload.filter(e => e.active > 0).length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No pending assignments
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}