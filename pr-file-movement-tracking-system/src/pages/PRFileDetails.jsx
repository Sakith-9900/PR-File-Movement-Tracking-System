import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import FileTimeline from "@/components/prfile/FileTimeline";
import AssignmentDialog from "@/components/prfile/AssignmentDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  UserPlus, 
  FileText, 
  Calendar, 
  User,
  Clock,
  CheckCircle2,
  Download,
  ExternalLink,
  History,
  Paperclip
} from "lucide-react";
import { toast } from "sonner";

export default function PRFileDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileId = urlParams.get("id");
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: prFile, isLoading: loadingFile } = useQuery({
    queryKey: ["prFile", fileId],
    queryFn: () => base44.entities.PRFile.filter({ id: fileId }).then(res => res[0]),
    enabled: !!fileId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments", fileId],
    queryFn: () => base44.entities.FileAssignment.filter({ pr_file_id: fileId }),
    enabled: !!fileId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", fileId],
    queryFn: () => base44.entities.FileDocument.filter({ pr_file_id: fileId }),
    enabled: !!fileId,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["auditLogs", fileId],
    queryFn: () => base44.entities.AuditLog.filter({ pr_file_id: fileId }),
    enabled: !!fileId,
  });

  const assignMutation = useMutation({
    mutationFn: async (assignmentData) => {
      const sequenceNumber = assignments.length + 1;
      
      await base44.entities.FileAssignment.create({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        employee_id: assignmentData.employee_id,
        employee_code: assignmentData.employee_code,
        employee_name: assignmentData.employee_name,
        assignment_date: new Date().toISOString(),
        status: "Assigned",
        sequence_number: sequenceNumber,
      });

      await base44.entities.PRFile.update(prFile.id, {
        current_holder_id: assignmentData.employee_id,
        current_holder_code: assignmentData.employee_code,
        status: "In Progress",
      });

      await base44.entities.AuditLog.create({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        action: `Assigned to ${assignmentData.employee_code}`,
        action_type: "Assigned",
        performed_by_code: assignmentData.employee_code,
        performed_by_name: assignmentData.employee_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prFile", fileId] });
      queryClient.invalidateQueries({ queryKey: ["assignments", fileId] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs", fileId] });
      toast.success("File assigned successfully");
      setIsAssignOpen(false);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PRFile.update(prFile.id, {
        status: "Closed",
        closed_date: format(new Date(), "yyyy-MM-dd"),
      });

      await base44.entities.AuditLog.create({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        action: "File closed",
        action_type: "Closed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prFile", fileId] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs", fileId] });
      toast.success("File closed successfully");
    },
  });

  if (loadingFile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!prFile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto text-center py-20">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">File Not Found</h2>
        <p className="text-slate-500 mb-4">The requested PR file could not be found.</p>
        <Link to={createPageUrl("PRFiles")}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to PR Files
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to={createPageUrl("PRFiles")} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to PR Files
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">{prFile.pr_number}</h1>
              <StatusBadge status={prFile.status} />
              <StatusBadge status={prFile.priority} />
            </div>
            <p className="text-slate-500">{prFile.contract_name}</p>
          </div>
          <div className="flex items-center gap-2">
            {prFile.status !== "Closed" && (
              <>
                <Button variant="outline" onClick={() => setIsAssignOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
                {prFile.status === "Pending Review" && (
                  <Button onClick={() => closeMutation.mutate()} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Close File
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">PR Date</p>
                    <p className="font-medium text-slate-900">{format(new Date(prFile.pr_date), "MMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Current Holder</p>
                    <p className="font-medium text-slate-900">{prFile.current_holder_code || "Not Assigned"}</p>
                  </div>
                </div>
                {prFile.contract_reference && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Contract Reference</p>
                      <p className="font-medium text-slate-900">{prFile.contract_reference}</p>
                    </div>
                  </div>
                )}
                {prFile.closed_date && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs text-emerald-600">Closed Date</p>
                      <p className="font-medium text-emerald-900">{format(new Date(prFile.closed_date), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
              </div>
              {prFile.description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Description</p>
                  <p className="text-slate-700">{prFile.description}</p>
                </div>
              )}
              {prFile.remarks && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Remarks</p>
                  <p className="text-slate-700">{prFile.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                File Movement Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileTimeline assignments={assignments} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No documents attached</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <a
                      key={doc.id}
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.document_name}</p>
                        <p className="text-xs text-slate-500">{doc.uploaded_by_code}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No activity recorded</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {auditLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(log => (
                    <div key={log.id} className="border-l-2 border-slate-200 pl-3 py-1">
                      <p className="text-sm font-medium text-slate-900">{log.action}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(log.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        prFile={prFile}
        employees={employees}
        onAssign={(data) => assignMutation.mutate(data)}
        isLoading={assignMutation.isPending}
      />
    </div>
  );
}