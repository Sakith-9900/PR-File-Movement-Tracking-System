import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
  Table2,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Shield,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, isLeader, userRole, user, currentUserCode } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Build navigation — User Management only for leaders
  const navigation = [
    { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
    { name: "PR Files", href: "PRFiles", icon: FileText },
    { name: "My Assignments", href: "MyAssignments", icon: ClipboardList },
    { name: "Master Sheet", href: "MasterSheet", icon: Table2 },
    { name: "Employees", href: "Employees", icon: Users },
    ...(isLeader ? [{ name: "User Management", href: "UserManagement", icon: UserCog }] : []),
    { name: "Reports", href: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">PR Tracker</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {userRole && (
            <div className="px-4 pt-3 pb-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                  isLeader
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
                )}
              >
                <Shield className="w-3 h-3" />
                {isLeader ? "Leader" : "Worker"}
              </span>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = currentPageName === item.href;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5",
                        isActive ? "text-blue-600" : "text-slate-400"
                      )}
                    />
                    {item.name}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            {user && (
              <div className="mb-4 px-2">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.email}
                </p>
                {currentUserCode && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Code: {currentUserCode}
                  </p>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-slate-900"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-slate-200 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">PR Tracker</span>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}