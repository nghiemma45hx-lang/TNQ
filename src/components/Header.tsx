import React, { useState } from "react";
import { AppTab, UserAdmin } from "../types";
import { CheckSquare, Camera, FileText, BarChart3, Settings, Home, Shield, LogOut, Menu, X, PlusCircle, Database } from "lucide-react";

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  adminUser: UserAdmin | null;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onQuickScan: () => void;
  isSupabaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  adminUser,
  onOpenAdminLogin,
  onLogoutAdmin,
  onQuickScan,
  isSupabaseConnected = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "home" as AppTab, label: "Trang chủ", icon: Home },
    { id: "exams" as AppTab, label: "Bài thi & Đáp án", icon: FileText },
    { id: "sheets" as AppTab, label: "In phiếu thi OMR", icon: PlusCircle },
    { id: "scan" as AppTab, label: "Quét chấm AI", icon: Camera },
    { id: "analytics" as AppTab, label: "Báo cáo & Phổ điểm", icon: BarChart3 },
    { id: "admin" as AppTab, label: "Quản trị Hệ thống", icon: Settings, badge: adminUser ? "Admin" : null },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-800">
                  EduMark<span className="text-indigo-600">AI</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                  NHQ THCS
                </span>
                <span
                  title={
                    isSupabaseConnected
                      ? "Active Supabase DB (pptigljquogmpizgaogd.supabase.co)"
                      : "Connecting to Supabase DB..."
                  }
                  className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    isSupabaseConnected
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <Database className="w-2.5 h-2.5" />
                  <span>{isSupabaseConnected ? "Supabase" : "Syncing..."}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs md:text-sm transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-400 text-slate-900 ml-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onQuickScan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 hover:shadow-md active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Chấm Nhanh</span>
            </button>

            {adminUser ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 pl-2 pr-3 py-1 rounded-xl">
                <img
                  src={adminUser.avatar}
                  alt="Admin Avatar"
                  className="w-7 h-7 rounded-lg object-cover border border-white"
                />
                <div className="text-left text-[11px] leading-tight">
                  <p className="font-bold text-slate-800">{adminUser.name}</p>
                  <p className="text-indigo-600 font-semibold text-[9px]">Quản Trị Viên</p>
                </div>
                <button
                  onClick={onLogoutAdmin}
                  title="Đăng xuất Admin"
                  className="ml-1 text-slate-400 hover:text-red-600 p-1 rounded hover:bg-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Đăng Nhập Admin</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={onQuickScan}
              className="bg-emerald-600 text-white p-2 rounded-lg text-xs"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1.5 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100">
            {adminUser ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <img src={adminUser.avatar} className="w-8 h-8 rounded-lg" />
                  <div>
                    <p className="text-xs font-bold">{adminUser.name}</p>
                    <p className="text-[10px] text-indigo-600">Đã đăng nhập Admin</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogoutAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-semibold px-2 py-1 rounded bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAdminLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Đăng Nhập Quản Trị (admin / admin)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
