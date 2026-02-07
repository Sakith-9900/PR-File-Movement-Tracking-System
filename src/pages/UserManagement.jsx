import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/Client";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    Users,
    Shield,
    ShieldCheck,
    ShieldOff,
    UserCog
} from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();

    // Fetch users and employees
    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ["users"],
        queryFn: () => base44.entities.User.list(),
    });

    const { data: employees = [], isLoading: loadingEmployees } = useQuery({
        queryKey: ["employees"],
        queryFn: () => base44.entities.Employee.list(),
    });

    // Toggle user active status
    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => base44.entities.User.update(id, { is_active: !isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User status updated successfully");
        },
        onError: () => {
            toast.error("Failed to update user status");
        },
    });

    const handleToggleStatus = (user) => {
        toggleStatusMutation.mutate({ id: user.id, isActive: user.is_active });
    };

    // Get employee name from employee_id
    const getEmployeeName = (employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee?.full_name || "Unknown";
    };

    // Filter users
    const filteredUsers = users.filter(user =>
        user.short_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEmployeeName(user.employee_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loadingUsers || loadingEmployees) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <Skeleton className="h-10 w-48 mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="User Management"
                subtitle="Manage user accounts and access control"
            >
                <Button disabled>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </PageHeader>

            {/* Stats */}
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
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-600 font-medium">Active Users</p>
                                <p className="text-3xl font-bold text-emerald-900 mt-1">
                                    {users.filter(u => u.is_active !== false).length}
                                </p>
                            </div>
                            <ShieldCheck className="w-10 h-10 text-emerald-500/50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 font-medium">Inactive Users</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">
                                    {users.filter(u => u.is_active === false).length}
                                </p>
                            </div>
                            <ShieldOff className="w-10 h-10 text-slate-500/50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search by short code or employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
                <EmptyState
                    icon={UserCog}
                    title={searchTerm ? "No users found" : "No users yet"}
                    description={searchTerm ? "Try a different search term" : "User accounts will appear here"}
                />
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map(user => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-900 text-lg">
                                                    {user.short_code}
                                                </h3>
                                                <Badge variant={user.is_active !== false ? "default" : "secondary"}>
                                                    {user.is_active !== false ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                {getEmployeeName(user.employee_id)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Employee ID: {user.employee_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            variant={user.is_active !== false ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => handleToggleStatus(user)}
                                            disabled={toggleStatusMutation.isPending}
                                        >
                                            {user.is_active !== false ? (
                                                <>
                                                    <ShieldOff className="w-4 h-4 mr-2" />
                                                    Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                                    Activate
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
