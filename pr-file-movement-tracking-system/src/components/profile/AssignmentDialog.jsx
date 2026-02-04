import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, UserPlus } from "lucide-react";

export default function AssignmentDialog({ 
  open, 
  onOpenChange, 
  prFile, 
  employees, 
  onAssign, 
  isLoading 
}) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (employee) {
      onAssign({
        employee_id: employee.employee_id,
        employee_code: employee.short_code,
        employee_name: employee.full_name,
        remarks,
      });
    }
  };

  const activeEmployees = employees.filter(emp => emp.is_active !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <UserPlus className="w-5 h-5" />
            Assign File
          </DialogTitle>
          <DialogDescription>
            Assign <span className="font-medium text-slate-900">{prFile?.pr_number}</span> to an employee
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <span className="font-medium">{employee.short_code}</span>
                    <span className="text-slate-500 ml-2">- {employee.full_name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Assignment Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Instructions or notes for the assignee..."
              rows={3}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedEmployee}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign File
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}