import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import StatusBadge from "@/components/common/StatusBadge";

export default function RFQPOSection({ prFile, rfqs = [], pos = [] }) {
  const [isRFQDialogOpen, setIsRFQDialogOpen] = useState(false);
  const [isPODialogOpen, setIsPODialogOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [rfqData, setRfqData] = useState({
    rfq_date: format(new Date(), "yyyy-MM-dd"),
    remarks: "",
  });
  const [poData, setPoData] = useState({
    po_date: format(new Date(), "yyyy-MM-dd"),
    remarks: "",
  });
  const queryClient = useQueryClient();

  const generateRFQNumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = rfqs
      .filter(r => r.rfq_number?.startsWith(`RFQ-${year}`))
      .map(r => parseInt(r.rfq_number.split("-")[2]) || 0);
    const nextNum = Math.max(0, ...existingNumbers) + 1;
    return `RFQ-${year}-${String(nextNum).padStart(4, "0")}`;
  };

  const generatePONumber = () => {
    const year = new Date().getFullYear();
    const existingNumbers = pos
      .filter(p => p.po_number?.startsWith(`PO-${year}`))
      .map(p => parseInt(p.po_number.split("-")[2]) || 0);
    const nextNum = Math.max(0, ...existingNumbers) + 1;
    return `PO-${year}-${String(nextNum).padStart(4, "0")}`;
  };

  const createRFQMutation = useMutation({
    mutationFn: async (data) => {
      const rfqNumber = generateRFQNumber();
      const rfq = await base44.entities.RFQ.create({
        rfq_number: rfqNumber,
        rfq_date: data.rfq_date,
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        contract_name: prFile.contract_name,
        status: "Open",
        remarks: data.remarks,
      });

      await base44.entities.AuditLog.create({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        action: `RFQ ${rfqNumber} created`,
        action_type: "Created",
        details: data.remarks,
      });

      return rfq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
      toast.success("RFQ created successfully");
      setIsRFQDialogOpen(false);
      setRfqData({ rfq_date: format(new Date(), "yyyy-MM-dd"), remarks: "" });
    },
  });

  const createPOMutation = useMutation({
    mutationFn: async (data) => {
      if (!selectedRFQ) {
        throw new Error("Please select an RFQ first");
      }

      const poNumber = generatePONumber();
      const po = await base44.entities.PO.create({
        po_number: poNumber,
        po_date: data.po_date,
        rfq_id: selectedRFQ.id,
        rfq_number: selectedRFQ.rfq_number,
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        contract_name: prFile.contract_name,
        status: "Open",
        remarks: data.remarks,
      });

      await base44.entities.AuditLog.create({
        pr_file_id: prFile.id,
        pr_number: prFile.pr_number,
        action: `PO ${poNumber} created (from ${selectedRFQ.rfq_number})`,
        action_type: "Created",
        details: data.remarks,
      });

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos"] });
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
      toast.success("PO created successfully");
      setIsPODialogOpen(false);
      setPoData({ po_date: format(new Date(), "yyyy-MM-dd"), remarks: "" });
      setSelectedRFQ(null);
    },
  });

  return (
    <div className="space-y-4">
      {/* RFQ Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">RFQ Numbers</CardTitle>
            <Button size="sm" onClick={() => setIsRFQDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Generate RFQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rfqs.length === 0 ? (
            <p className="text-sm text-slate-500">No RFQ generated yet</p>
          ) : (
            <div className="space-y-2">
              {rfqs.map(rfq => (
                <div key={rfq.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{rfq.rfq_number}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(rfq.rfq_date), "dd MMM yyyy")}
                    </div>
                  </div>
                  <StatusBadge status={rfq.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PO Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">PO Numbers</CardTitle>
            <Button 
              size="sm" 
              onClick={() => setIsPODialogOpen(true)}
              disabled={rfqs.length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />
              Generate PO
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pos.length === 0 ? (
            <p className="text-sm text-slate-500">
              {rfqs.length === 0 ? "Create an RFQ first to generate PO" : "No PO generated yet"}
            </p>
          ) : (
            <div className="space-y-2">
              {pos.map(po => (
                <div key={po.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{po.po_number}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(po.po_date), "dd MMM yyyy")}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">From: {po.rfq_number}</div>
                  </div>
                  <StatusBadge status={po.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RFQ Dialog */}
      <Dialog open={isRFQDialogOpen} onOpenChange={setIsRFQDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate RFQ Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createRFQMutation.mutate(rfqData); }} className="space-y-4">
            <div className="space-y-2">
              <Label>RFQ Number</Label>
              <Input value={generateRFQNumber()} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfq_date">RFQ Date *</Label>
              <Input
                id="rfq_date"
                type="date"
                value={rfqData.rfq_date}
                onChange={(e) => setRfqData({ ...rfqData, rfq_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfq_remarks">Remarks</Label>
              <Textarea
                id="rfq_remarks"
                value={rfqData.remarks}
                onChange={(e) => setRfqData({ ...rfqData, remarks: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRFQDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRFQMutation.isPending}>
                {createRFQMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate RFQ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PO Dialog */}
      <Dialog open={isPODialogOpen} onOpenChange={setIsPODialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate PO Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createPOMutation.mutate(poData); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Select RFQ *</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedRFQ?.id || ""}
                onChange={(e) => setSelectedRFQ(rfqs.find(r => r.id === e.target.value))}
                required
              >
                <option value="">Select an RFQ</option>
                {rfqs.map(rfq => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.rfq_number} - {format(new Date(rfq.rfq_date), "dd MMM yyyy")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input value={generatePONumber()} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_date">PO Date *</Label>
              <Input
                id="po_date"
                type="date"
                value={poData.po_date}
                onChange={(e) => setPoData({ ...poData, po_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_remarks">Remarks</Label>
              <Textarea
                id="po_remarks"
                value={poData.remarks}
                onChange={(e) => setPoData({ ...poData, remarks: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPODialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPOMutation.isPending}>
                {createPOMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate PO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}