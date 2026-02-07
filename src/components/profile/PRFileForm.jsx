import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PRFileForm({ open, onOpenChange, prFile, onSave, isLoading, nextPRNumber }) {
  const [formData, setFormData] = useState({
    pr_number: "",
    pr_date: format(new Date(), "yyyy-MM-dd"),
    contract_name: "",
    contract_reference: "",
    description: "",
    priority: "Medium",
    remarks: "",
  });

  useEffect(() => {
    if (prFile) {
      setFormData({
        pr_number: prFile.pr_number || "",
        pr_date: prFile.pr_date || format(new Date(), "yyyy-MM-dd"),
        contract_name: prFile.contract_name || "",
        contract_reference: prFile.contract_reference || "",
        description: prFile.description || "",
        priority: prFile.priority || "Medium",
        remarks: prFile.remarks || "",
      });
    } else {
      setFormData({
        pr_number: nextPRNumber || "",
        pr_date: format(new Date(), "yyyy-MM-dd"),
        contract_name: "",
        contract_reference: "",
        description: "",
        priority: "Medium",
        remarks: "",
      });
    }
  }, [prFile, open, nextPRNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {prFile ? "Edit PR File" : "Create New PR File"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pr_number">PR Number *</Label>
              <Input
                id="pr_number"
                value={formData.pr_number}
                onChange={(e) => setFormData({ ...formData, pr_number: e.target.value })}
                placeholder="PR-2024-001"
                required
                disabled={!!prFile}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pr_date">PR Date *</Label>
              <Input
                id="pr_date"
                type="date"
                value={formData.pr_date}
                onChange={(e) => setFormData({ ...formData, pr_date: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contract_name">Contract Name *</Label>
            <Input
              id="contract_name"
              value={formData.contract_name}
              onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
              placeholder="Enter contract name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_reference">Contract Reference</Label>
              <Input
                id="contract_reference"
                value={formData.contract_reference}
                onChange={(e) => setFormData({ ...formData, contract_reference: e.target.value })}
                placeholder="CON-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the file..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Additional remarks..."
              rows={2}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {prFile ? "Update" : "Create PR File"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}