import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Upload, FileIcon, X, Play, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function UpdateWorkDialog({ 
  open, 
  onOpenChange, 
  assignment, 
  onStartWork,
  onCompleteWork,
  onUploadDocument,
  isLoading 
}) {
  const [remarks, setRemarks] = useState(assignment?.work_remarks || "");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isStarted = assignment?.status === "In Progress";
  const isCompleted = assignment?.status === "Completed";

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);
    
    for (const file of selectedFiles) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFiles(prev => [...prev, { name: file.name, url: file_url }]);
    }
    
    setUploading(false);
    toast.success("File(s) uploaded successfully");
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartWork = () => {
    onStartWork(assignment.id);
  };

  const handleCompleteWork = () => {
    onCompleteWork(assignment.id, { remarks, documents: files });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Update Work Progress
          </DialogTitle>
          <DialogDescription>
            PR: <span className="font-medium text-slate-900">{assignment?.pr_number}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Status indicator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Current Status</p>
                <p className="font-medium text-slate-900">{assignment?.status}</p>
              </div>
              {!isStarted && !isCompleted && (
                <Button onClick={handleStartWork} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Start Work
                </Button>
              )}
            </div>
          </div>

          {/* Work Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Work Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe the work done or any notes..."
              rows={4}
              disabled={isCompleted}
            />
          </div>

          {/* Document Upload */}
          {!isCompleted && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 mx-auto text-slate-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Click to upload documents</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, Images, Documents</p>
                  </>
                )}
              </div>

              {files.length > 0 && (
                <div className="space-y-2 mt-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {isStarted && !isCompleted && (
              <Button 
                onClick={handleCompleteWork} 
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Complete & Sign Off
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}