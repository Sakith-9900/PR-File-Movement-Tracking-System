import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";

export default function DeleteRequestDialog({
  open,
  onOpenChange,
  prFile,
  onSubmit,
  isLoading,
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ reason });
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-amber-700">
            <TriangleAlert className="w-5 h-5 text-amber-500" />
            Request Delete Permission
          </DialogTitle>
          <DialogDescription>
            You need administrator approval to delete{" "}
            <span className="font-semibold text-slate-900">
              {prFile?.pr_number}
            </span>
            . Your request will be sent to the administrator for review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* File Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-800">{prFile?.pr_number}</p>
            <p className="text-amber-600 mt-0.5">{prFile?.contract_name}</p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="delete-reason">
              Reason for deletion <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this PR file should be deleted..."
              rows={4}
              required
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
