import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import EmployeeForm from "@/components/employees/EmployeeForm";
import EmployeeCard from "@/components/employees/EmployeeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Employees() {
  const { isLeader } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, isError, error } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return newEmployee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updatedEmployee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setIsFormOpen(false);
      setSelectedEmployee(null);
    },
  });

  const handleSave = (data) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.short_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-center py-20">
        <Users className="w-16 h-16 mx-auto text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to load employees</h2>
        <p className="text-slate-500 mb-4">{error?.message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Employees"
        subtitle="Manage employee directory and short codes"
      >
        {isLeader && (
          <Button onClick={() => { setSelectedEmployee(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name, code, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? "No employees found" : "No employees yet"}
          description={searchTerm ? "Try a different search term" : "Add your first employee to get started"}
          action={
            !searchTerm && isLeader && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            )
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(employee => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEdit}
              isLeader={isLeader}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <EmployeeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        employee={selectedEmployee}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}