import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Crown,
  Wrench,
  Trash2,
  CheckCircle2,
  CircleX,
  Clock,
  Loader2,
  TriangleAlert,
  Eye,
  EyeOff,
  ArrowDownCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Add User Dialog (administrator only) ────────────────────────────────────────────
function AddUserDialog({ open, onOpenChange, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isLoading) return;
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError("");
    onOpenChange(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const { data, error: createError } = await supabase.functions.invoke("create-user", {
        body: { email: email.trim().toLowerCase(), password },
      });
      if (createError) {
        let message = "Unable to create user. Check that the create-user function is deployed and try again.";
        try {
          const response = await createError.context?.json();
          message = response?.error || message;
        } catch { /* Use the fallback for connection errors. */ }
        throw new Error(message);
      }
      if (!data?.user) throw new Error(data?.error || "Unable to create user.");
      toast.success("User created. They can sign in with their email and password.");
      onSuccess();
      setEmail("");
      setPassword("");
      setShowPassword(false);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>Create a staff account with an email and password. They can sign in immediately.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <div className="relative">
              <Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required disabled={isLoading} className="pr-10" aria-describedby="password-help" />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p id="password-help" className="text-xs text-slate-500">Use at least 6 characters.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
// ─── Role badge helper ─────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (role === "leader") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <Crown className="w-3 h-3" /> Administrator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
      <Wrench className="w-3 h-3" /> Staff
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { isLeader, userRole, isLoadingAuth } = useAuth();
  if (isLoadingAuth || userRole === null) return <div className="p-8" role="status">Checking access...</div>;
  if (!isLeader) return <div className="p-8"><h1 className="text-xl font-semibold">Administrator access required</h1><p className="mt-2 text-slate-500">Only administrators can manage users.</p></div>;
  return <AdminUserManagement />;
}

function AdminUserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isLeader, currentUserDbId } = useAuth();

  // Fetch users
  const {
    data: users = [],
    isLoading: loadingUsers,
    isError: isUsersError,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending delete requests (administrator only)
  const { data: deleteRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["deleteRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delete_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isLeader,
  });

  // Toggle active status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { data, error } = await supabase
        .from("users")
        .update({ is_active: !isActive })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated.");
    },
    onError: () => toast.error("Failed to update user status."),
  });

  // Change role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, newRole }) => {
      const { data, error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`User role changed to ${data.role}.`);
    },
    onError: () => toast.error("Failed to change role."),
  });

  // Approve delete request
  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, prFileId }) => {
      // Delete the PR file
      const { error: deleteError } = await supabase
        .from("pr_files")
        .delete()
        .eq("id", prFileId);
      if (deleteError) throw deleteError;

      // Mark request approved
      const { error: updateError } = await supabase
        .from("delete_requests")
        .update({
          status: "approved",
          reviewed_by_id: currentUserDbId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleteRequests"] });
      queryClient.invalidateQueries({ queryKey: ["prFiles"] });
      toast.success("Delete request approved. PR file has been deleted.");
    },
    onError: (err) => toast.error(`Failed to approve: ${err.message}`),
  });

  // Reject delete request
  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId }) => {
      const { error } = await supabase
        .from("delete_requests")
        .update({
          status: "rejected",
          reviewed_by_id: currentUserDbId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleteRequests"] });
      toast.success("Delete request rejected.");
    },
    onError: () => toast.error("Failed to reject request."),
  });

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.employee_id === employeeId || e.id === employeeId);
    return employee?.full_name || null;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.short_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEmployeeName(user.employee_id)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = deleteRequests.filter((r) => r.status === "pending");
  const leaders = users.filter((u) => u.role === "leader");
  const workers = users.filter((u) => u.role !== "leader");

  if (loadingUsers || loadingEmployees) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isUsersError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-center py-20">
        <ShieldOff className="w-16 h-16 mx-auto text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to load users</h2>
        <p className="text-slate-500 mb-4">{usersError?.message}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="User Management"
        subtitle={
          isLeader
            ? "Manage user accounts, roles, and delete permission requests"
            : "View system user accounts"
        }
      >
        {isLeader && (
          <Button onClick={() => setIsAddUserOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </PageHeader>

      {/* ── Stats ── */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Administrators</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{leaders.length}</p>
              </div>
              <Crown className="w-10 h-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Staff</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{workers.length}</p>
              </div>
              <Wrench className="w-10 h-10 text-slate-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pending Delete Requests (administrator only) ── */}
      {isLeader && pendingRequests.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <TriangleAlert className="w-5 h-5 text-amber-500" />
              Pending Delete Requests
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-amber-200 rounded-xl p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-900">{req.pr_number}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {req.created_at ? format(new Date(req.created_at), "MMM d, yyyy 'at' h:mm a") : ""}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Requested by:</span> {req.requested_by_code}
                    </p>
                    {req.reason && (
                      <p className="text-sm text-slate-500 mt-1 italic">"{req.reason}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => rejectRequestMutation.mutate({ requestId: req.id })}
                      disabled={rejectRequestMutation.isPending || approveRequestMutation.isPending}
                    >
                      <CircleX className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() =>
                        approveRequestMutation.mutate({
                          requestId: req.id,
                          prFileId: req.pr_file_id,
                        })
                      }
                      disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve & Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search ── */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by email, short code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ── User List ── */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={searchTerm ? "No users found" : "No users yet"}
          description={
            searchTerm ? "Try a different search term" : "User accounts will appear here"
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const empName = getEmployeeName(user.employee_id);
            const isCurrentUser = user.id === currentUserDbId;
            return (
              <Card
                key={user.id}
                className={`hover:shadow-md transition-shadow ${isCurrentUser ? "border-blue-300 bg-blue-50/30" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          user.role === "leader"
                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : "bg-gradient-to-br from-blue-500 to-blue-600"
                        }`}
                      >
                        {user.role === "leader" ? (
                          <Crown className="w-6 h-6 text-white" />
                        ) : (
                          <Wrench className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 text-base">
                            {user.short_code}
                            {isCurrentUser && (
                              <span className="ml-1 text-xs font-normal text-blue-500">(you)</span>
                            )}
                          </h3>
                          <RoleBadge role={user.role} />
                          <Badge
                            variant={user.is_active !== false ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.is_active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        {empName && (
                          <p className="text-xs text-slate-400 mt-0.5">Employee: {empName}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions (administrator only, cannot modify self) */}
                    {isLeader && !isCurrentUser && (
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {/* Promote / Demote */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            changeRoleMutation.mutate({
                              id: user.id,
                              newRole: user.role === "leader" ? "worker" : "leader",
                            })
                          }
                          disabled={changeRoleMutation.isPending}
                          className={
                            user.role === "leader"
                              ? "border-slate-300 text-slate-600"
                              : "border-amber-300 text-amber-700 hover:bg-amber-50"
                          }
                        >
                          {changeRoleMutation.isPending &&
                          changeRoleMutation.variables?.id === user.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : user.role === "leader" ? (
                            <>
                              <ArrowDownCircle className="w-4 h-4 mr-1" />
                              Demote
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 mr-1" />
                              Promote
                            </>
                          )}
                        </Button>

                        {/* Activate / Deactivate */}
                        <Button
                          variant={user.is_active !== false ? "outline" : "default"}
                          size="sm"
                          onClick={() =>
                            toggleStatusMutation.mutate({ id: user.id, isActive: user.is_active })
                          }
                          disabled={toggleStatusMutation.isPending}
                        >
                          {user.is_active !== false ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Resolved delete requests (leader only) ── */}
      {isLeader && deleteRequests.filter((r) => r.status !== "pending").length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Resolved Delete Requests
          </h2>
          <div className="space-y-2">
            {deleteRequests
              .filter((r) => r.status !== "pending")
              .map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 opacity-70"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-slate-700">{req.pr_number}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          req.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {req.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      By {req.requested_by_code} •{" "}
                      {req.reviewed_at
                        ? format(new Date(req.reviewed_at), "MMM d, yyyy")
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Add User Dialog ── */}
      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        employees={employees}
        users={users}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
      />
    </div>
  );
}
