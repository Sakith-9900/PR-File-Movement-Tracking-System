import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import PRFileForm from "@/components/profile/PRFileForm";
import PRFileCard from "@/components/profile/PRFileCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssignmentDialog from "@/components/profile/AssignmentDialog";
import DeleteRequestDialog from "@/components/profile/DeleteRequestDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PRFiles() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteRequestOpen, setIsDeleteRequestOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { isLeader, currentUserCode, currentUserDbId } = useAuth();

  // FIX: Added isFetching to catch background refetches after a new file is created
  const { data: prFiles = [], isLoading: loadingFiles, isFetching: fetchingFiles } = useQuery({
    queryKey: ["prFiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pr_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [], isLoading: loadingEmployees, isFetching: fetchingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_assignments')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Generate next PR number
  const generatePRNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = prFiles
      .filter(f => f.pr_number?.startsWith(`PR-${year}`))
      .map(f => parseInt(f.pr_number.split("-")[2]) || 0);
    const nextNum = Math.max(0, ...existingNumbers) + 1;
    return `PR-${year}-${String(nextNum).padStart(4, "0")}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: prFile, error } = await supabase
        .from('pr_files')
        .insert({ ...data, status: "Open" })
        .select()
        .single();
      if (error) throw error;

      // Create audit log
      await supabase.from('audit_logs').insert({
        pr_file_id: prFile.id,
        pr_number: data.pr_number,
        action: `PR File ${data.pr_number} created`,
        details: `Contract: ${data.contract_name}`,
      });
      return prFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prFiles"] });
      toast.success("PR File created successfully");
      setIsFormOpen(false);
    },
    onError: (error) => {
      console.error("Failed to create PR file:", error);
      toast.error(`Failed to create PR file: ${error.message || "Unknown error"}`);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ prFile, assignmentData }) => {
      const existingAssignments = assignments.filter(a => a.pr_file_id === prFile.id);
      const sequenceNumber = existingAssignments.length + 1;

      // Create assignment
      const { error: assignError } = await supabase
        .from('file_assignments')
        .insert({
          pr_file_id: prFile.id,
          pr_number: prFile.pr_number,
          employee_id: assignmentData.employee_id,
          employee_code: assignmentData.employee_code,
          employee_name: assignmentData.employee_name,
          assignment_date: new Date().toISOString(),
          status: "Assigned",
          sequence_number: sequenceNumber,
        });
      if (assignError) throw assignError;

      // Update PR file
      const { error: updateError } = await supabase
        .from('pr_files')
        .update({
          current_holder_id: assignmentData.employee_id,
          current_holder_code: assignmentData.employee_code,
          status: "In Progress",
        })
        .eq('id', prFile.id);
      if (updateError) throw updateError;

      // Create audit log
      await supabase.from('audit_logs').insert({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        action: `Assigned to ${assignmentData.employee_code}`,
        details: `Assigned by system`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prFiles"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("File assigned successfully");
      setIsAssignOpen(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      console.error("Failed to assign file:", error);
      toast.error(`Failed to assign file: ${error.message || "Unknown error"}`);
    },
  });

  // Administrator: direct delete
  const deleteMutation = useMutation({
    mutationFn: async (prFile) => {
      const { error } = await supabase
        .from('pr_files')
        .delete()
        .eq('id', prFile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prFiles"] });
      toast.success("PR File deleted.");
    },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`),
  });

  // Worker: submit delete request
  const deleteRequestMutation = useMutation({
    mutationFn: async ({ prFile, reason }) => {
      const { error } = await supabase.from('delete_requests').insert({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        requested_by_id: currentUserDbId,
        requested_by_code: currentUserCode,
        reason,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delete request sent to administrator for approval.");
      setIsDeleteRequestOpen(false);
      setSelectedFile(null);
    },
    onError: (err) => toast.error(`Failed to send request: ${err.message}`),
  });

  const handleSave = (data) => {
    createMutation.mutate(data);
  };

  const handleAssign = (assignmentData) => {
    assignMutation.mutate({ prFile: selectedFile, assignmentData });
  };

  const openAssignDialog = (prFile) => {
    setSelectedFile(prFile);
    setIsAssignOpen(true);
  };

  const handleDeleteClick = (prFile) => {
    setSelectedFile(prFile);
    if (isLeader) {
      if (window.confirm(`Are you sure you want to permanently delete ${prFile.pr_number}?`)) {
        deleteMutation.mutate(prFile);
      }
    } else {
      setIsDeleteRequestOpen(true);
    }
  };

  const filteredFiles = prFiles.filter(file => {
    const matchesSearch =
      file.pr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.contract_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // FIX: Added fetchingFiles and fetchingEmployees to the skeleton loader condition
  if (loadingFiles || loadingEmployees || fetchingFiles || fetchingEmployees) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="PR Files"
        subtitle="Manage and track official file movement"
      >
        <Button onClick={() => { setSelectedFile(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create PR File
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search PR number or contract..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Open">Open</TabsTrigger>
            <TabsTrigger value="In Progress">In Progress</TabsTrigger>
            <TabsTrigger value="Pending Review">Pending</TabsTrigger>
            <TabsTrigger value="Closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchTerm || statusFilter !== "all" ? "No files found" : "No PR files yet"}
          description={searchTerm ? "Try a different search term" : "Create your first PR file to start tracking"}
          action={
            !searchTerm && statusFilter === "all" && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create PR File
              </Button>
            )
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => (
            <PRFileCard
              key={file.id}
              prFile={file}
              onAssign={openAssignDialog}
              onDelete={handleDeleteClick}
              isLeader={isLeader}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <PRFileForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        prFile={null}
        onSave={handleSave}
        isLoading={createMutation.isPending}
        nextPRNumber={generatePRNumber()}
      />

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        prFile={selectedFile}
        employees={employees}
        onAssign={handleAssign}
        isLoading={assignMutation.isPending}
      />

      {/* Delete Request Dialog (worker only) */}
      <DeleteRequestDialog
        open={isDeleteRequestOpen}
        onOpenChange={setIsDeleteRequestOpen}
        prFile={selectedFile}
        onSubmit={({ reason }) => deleteRequestMutation.mutate({ prFile: selectedFile, reason })}
        isLoading={deleteRequestMutation.isPending}
      />
    </div>
  );
}