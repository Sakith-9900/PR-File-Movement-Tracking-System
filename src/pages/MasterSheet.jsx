import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Download, 
  ChevronRight,
  ArrowUpDown,
  Filter
} from "lucide-react";

export default function MasterSheet() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("pr_date");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data: prFiles = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["prFiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from('pr_files').select('*');
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

  const { data: rfqs = [] } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from('rfqs').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: pos = [] } = useQuery({
    queryKey: ["pos"],
    queryFn: async () => {
      const { data, error } = await supabase.from('pos').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Get assignment history for each file
  const getFileAssignments = (fileId) => {
    return assignments
      .filter(a => a.pr_file_id === fileId)
      .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
  };

  // Get RFQ/PO numbers for each file
  const getFileRFQs = (fileId) => rfqs.filter(r => r.pr_file_id === fileId);
  const getFilePOs = (fileId) => pos.filter(p => p.pr_file_id === fileId);

  // Filter and sort
  const filteredFiles = prFiles
    .filter(file => {
      const matchesSearch = 
        file.pr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.contract_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.current_holder_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || file.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "pr_date") {
        comparison = new Date(a.pr_date) - new Date(b.pr_date);
      } else if (sortBy === "pr_number") {
        comparison = a.pr_number.localeCompare(b.pr_number);
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const exportToCSV = () => {
    const headers = ["PR Number", "PR Date", "Contract Name", "RFQ Numbers", "PO Numbers", "Status", "Priority", "Current Holder", "Assignment History"];
    const rows = filteredFiles.map(file => {
      const fileAssignments = getFileAssignments(file.id);
      const fileRFQs = getFileRFQs(file.id);
      const filePOs = getFilePOs(file.id);
      const history = fileAssignments.map(a => `${a.employee_code}(${a.status})`).join(" → ");
      const rfqNumbers = fileRFQs.map(r => r.rfq_number).join(", ");
      const poNumbers = filePOs.map(p => p.po_number).join(", ");
      return [
        file.pr_number,
        file.pr_date,
        file.contract_name,
        rfqNumbers || "N/A",
        poNumbers || "N/A",
        file.status,
        file.priority,
        file.current_holder_code || "N/A",
        history || "N/A"
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pr-master-sheet-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (loadingFiles) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
      <PageHeader 
        title="Master Tracking Sheet" 
        subtitle="Complete register view of all PR files"
      >
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search PR number, contract, or holder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Pending Review">Pending Review</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("pr_number")}
                >
                  <div className="flex items-center gap-1">
                    PR Number
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("pr_date")}
                >
                  <div className="flex items-center gap-1">
                    PR Date
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </TableHead>
                <TableHead>Contract Name</TableHead>
                <TableHead>RFQ Numbers</TableHead>
                <TableHead>PO Numbers</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Current Holder</TableHead>
                <TableHead>Assignment Timeline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-500">
                    No PR files found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map(file => {
                  const fileAssignments = getFileAssignments(file.id);
                  const fileRFQs = getFileRFQs(file.id);
                  const filePOs = getFilePOs(file.id);
                  return (
                    <TableRow key={file.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{file.pr_number}</TableCell>
                      <TableCell>{format(new Date(file.pr_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{file.contract_name}</TableCell>
                      <TableCell>
                        {fileRFQs.length > 0 ? (
                          <div className="space-y-1">
                            {fileRFQs.map(rfq => (
                              <div key={rfq.id} className="text-xs font-medium">{rfq.rfq_number}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {filePOs.length > 0 ? (
                          <div className="space-y-1">
                            {filePOs.map(po => (
                              <div key={po.id} className="text-xs font-medium">{po.po_number}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={file.status} /></TableCell>
                      <TableCell><StatusBadge status={file.priority} /></TableCell>
                      <TableCell>
                        {file.current_holder_code ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-sm font-medium">
                            {file.current_holder_code}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap max-w-[300px]">
                          {fileAssignments.length === 0 ? (
                            <span className="text-slate-400 text-sm">No assignments</span>
                          ) : (
                            fileAssignments.map((a, i) => (
                              <React.Fragment key={a.id}>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  a.status === "Completed" 
                                    ? "bg-emerald-100 text-emerald-700"
                                    : a.status === "In Progress"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                                }`}>
                                  {a.employee_code}
                                </span>
                                {i < fileAssignments.length - 1 && (
                                  <span className="text-slate-300">→</span>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={createPageUrl("PRFileDetails") + `?id=${file.id}`}>
                          <Button variant="ghost" size="sm">
                            View <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredFiles.length} of {prFiles.length} files
      </div>
    </div>
  );
}