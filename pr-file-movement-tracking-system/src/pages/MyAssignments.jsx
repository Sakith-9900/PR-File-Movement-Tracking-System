import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import UpdateWorkDialog from "@/components/prfile/UpdateWorkDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Calendar, 
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
  User
} from "lucide-react";
import { toast } from "sonner";

export default function MyAssignments() {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: allAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["allAssignments"],
    queryFn: () => base44.entities.FileAssignment.list("-created_date"),
  });

  const { data: prFiles = [] } = useQuery({
    queryKey: ["prFiles"],
    queryFn: () => base44.entities.PRFile.list(),
  });

  // Filter assignments by selected employee
  const assignments = selectedEmployee 
    ? allAssignments.filter(a => a.employee_id === employees.find(e => e.id === selectedEmployee)?.employee_id)
    : allAssignments;

  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === "active") return a.status === "Assigned" || a.status === "In Progress";
    if (statusFilter === "completed") return a.status === "Completed";
    return true;
  });

  const startWorkMutation = useMutation({
    mutationFn: async (assignmentId) => {
      const assignment = allAssignments.find(a => a.id === assignmentId);
      await base44.entities.FileAssignment.update(assignmentId, {
        status: "In Progress",
        start_date: new Date().toISOString(),
      });

      await base44.entities.AuditLog.create({
        pr_file_id: assignment.pr_file_id,
        pr_number: assignment.pr_number,
        action: `Work started by ${assignment.employee_code}`,
        action_type: "Started",
        performed_by_code: assignment.employee_code,
        performed_by_name: assignment.employee_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success("Work started");
      setIsUpdateOpen(false);
    },
  });

  const completeWorkMutation = useMutation({
    mutationFn: async ({ assignmentId, data }) => {
      const assignment = allAssignments.find(a => a.id === assignmentId);
      
      // Update assignment
      await base44.entities.FileAssignment.update(assignmentId, {
        status: "Completed",
        end_date: new Date().toISOString(),
        work_remarks: data.remarks,
      });

      // Upload documents if any
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          await base44.entities.FileDocument.create({
            pr_file_id: assignment.pr_file_id,
            pr_number: assignment.pr_number,
            assignment_id: assignmentId,
            document_name: doc.name,
            document_url: doc.url,
            uploaded_by_code: assignment.employee_code,
          });
        }
      }

      // Update PR file status
      await base44.entities.PRFile.update(assignment.pr_file_id, {
        status: "Pending Review",
        current_holder_id: null,
        current_holder_code: null,
      });

      // Create audit log
      await base44.entities.AuditLog.create({
        pr_file_id: assignment.pr_file_id,
        pr_number: assignment.pr_number,
        action: `Work completed by ${assignment.employee_code}`,
        action_type: "Completed",
        performed_by_code: assignment.employee_code,
        performed_by_name: assignment.employee_name,
        details: data.remarks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["prFiles"] });
      toast.success("Work completed and signed off");
      setIsUpdateOpen(false);
      setSelectedAssignment(null);
    },
  });

  const openUpdateDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setIsUpdateOpen(true);
  };

  const getPRFile = (prFileId) => prFiles.find(f => f.id === prFileId);

  if (loadingEmployees || loadingAssignments) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter(e => e.is_active !== false);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader 
        title="My Assignments" 
        subtitle="View and update your assigned files"
      />

      {/* Employee Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-slate-500 mb-2 block">Select Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your employee code" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <span className="font-medium">{emp.short_code}</span>
                      <span className="text-slate-500 ml-2">- {emp.full_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-slate-500 mb-2 block">Filter</Label>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {!selectedEmployee ? (
        <EmptyState
          icon={User}
          title="Select an Employee"
          description="Choose your employee code from the dropdown above to view your assignments"
        />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Assignments"
          description={statusFilter === "active" ? "You have no active assignments" : "No assignments found"}
        />
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map(assignment => {
            const prFile = getPRFile(assignment.pr_file_id);
            return (
              <Card key={assignment.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{assignment.pr_number}</h3>
                          <StatusBadge status={assignment.status} />
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{prFile?.contract_name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Assigned: {format(new Date(assignment.assignment_date), "MMM d")}
                          </span>
                          {assignment.start_date && (
                            <span className="flex items-center gap-1">
                              <Play className="w-3.5 h-3.5" />
                              Started: {format(new Date(assignment.start_date), "MMM d")}
                            </span>
                          )}
                          {assignment.end_date && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed: {format(new Date(assignment.end_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      {assignment.status !== "Completed" && (
                        <Button onClick={() => openUpdateDialog(assignment)}>
                          {assignment.status === "Assigned" ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Work
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Update & Sign Off
                            </>
                          )}
                        </Button>
                      )}
                      <Link to={createPageUrl("PRFileDetails") + `?id=${assignment.pr_file_id}`}>
                        <Button variant="outline" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {assignment.work_remarks && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Work Remarks</p>
                      <p className="text-sm text-slate-700">{assignment.work_remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Work Dialog */}
      {selectedAssignment && (
        <UpdateWorkDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          assignment={selectedAssignment}
          onStartWork={(id) => startWorkMutation.mutate(id)}
          onCompleteWork={(id, data) => completeWorkMutation.mutate({ assignmentId: id, data })}
          isLoading={startWorkMutation.isPending || completeWorkMutation.isPending}
        />
      )}
    </div>
  );
}