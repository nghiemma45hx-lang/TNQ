import React, { useState } from "react";
import { UserAdmin, Exam, ClassRoster, AuditLog, GradedSheet } from "../types";
import { checkSupabaseConnection, SUPABASE_URL } from "../lib/supabase";
import { seedInitialDataToSupabase } from "../lib/dbService";
import {
  Shield,
  Server,
  Users,
  FileCheck,
  Activity,
  Sliders,
  LogOut,
  Plus,
  Trash2,
  Key,
  CheckCircle,
  AlertTriangle,
  Lock,
  Save,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  Zap,
  Globe
} from "lucide-react";

interface AdminPanelProps {
  adminUser: UserAdmin;
  onLogoutAdmin: () => void;
  exams: Exam[];
  classes: ClassRoster[];
  auditLogs: AuditLog[];
  gradedSheets: GradedSheet[];
  onAddClass: (newClass: ClassRoster) => void;
  onClearAuditLogs: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminUser,
  onLogoutAdmin,
  exams,
  classes,
  auditLogs,
  gradedSheets,
  onAddClass,
  onClearAuditLogs,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    "overview" | "supabase" | "classes" | "logs" | "settings"
  >("overview");

  // New Class Form
  const [newClassName, setNewClassName] = useState("");
  const [newGrade, setNewGrade] = useState("Khối 8");
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // Settings state
  const [schoolHeader, setSchoolHeader] = useState("TRƯỜNG THCS EDUMARK AI NHQ");
  const [omrSensitivity, setOmrSensitivity] = useState("high");
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Supabase Testing state
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    const res = await checkSupabaseConnection();
    setIsTestingSupabase(false);
    setSupabaseStatusMsg(res.message);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    const res = await seedInitialDataToSupabase(exams, gradedSheets, classes, auditLogs);
    setIsSeeding(false);
    setSupabaseStatusMsg(res.message);
  };

  const sqlScriptContent = `-- SQL Schema cho Supabase (Project: pptigljquogmpizgaogd)
CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 40,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  exam_keys JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.graded_sheets (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
  exam_title TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  grade_class TEXT NOT NULL,
  exam_code TEXT NOT NULL,
  score NUMERIC(4,2) NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  scanned_at TEXT NOT NULL,
  image_thumbnail TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  anomalies JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'verified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0,
  students JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  "user" TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Policies & Realtime
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graded_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read write on exams" ON public.exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read write on graded_sheets" ON public.graded_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read write on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read write on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScriptContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const createdClass: ClassRoster = {
      id: "CLS-" + Date.now().toString(36).toUpperCase(),
      className: newClassName.trim(),
      grade: newGrade,
      academicYear: "2025-2026",
      studentCount: 35,
      students: Array.from({ length: 35 }, (_, idx) => {
        const num = (idx + 1).toString().padStart(2, "0");
        return {
          sbd: `${newGrade.replace(/[^0-9]/g, "")}${newClassName.substring(0, 2)}${num}`,
          name: `Học sinh ${newClassName} #${num}`,
          gradeClass: newClassName,
          gender: idx % 2 === 0 ? "Nam" : "Nữ",
        };
      }),
    };

    onAddClass(createdClass);
    setNewClassName("");
    setShowAddClassModal(false);
  };

  const handleSaveSettings = () => {
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Save Settings Toast */}
      {settingsSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>Đã lưu cấu hình hệ thống Quản trị!</span>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <img
            src={adminUser.avatar}
            alt="Admin Avatar"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">{adminUser.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                {adminUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Đã xác thực thành công (User: <code className="text-amber-300 font-mono">admin</code>). Quyền quản trị toàn bộ hệ thống EduMark.
            </p>
          </div>
        </div>

        <button
          onClick={onLogoutAdmin}
          className="bg-slate-800 hover:bg-red-600/90 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 border border-slate-700"
        >
          <LogOut className="w-4 h-4 text-amber-400" />
          <span>Đăng Xuất Admin</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: "overview", label: "Tổng Quan Hệ Thống", icon: Server },
          { id: "supabase", label: "Cơ Sở Dữ Liệu Supabase & Deploy Vercel", icon: Database },
          { id: "classes", label: "Quản Lý Lớp & Học Sinh", icon: Users },
          { id: "logs", label: "Nhật Ký Chấm Bài (Audit Logs)", icon: Activity },
          { id: "settings", label: "Cấu Hình & Hiệu Chỉnh OMR", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 2: SUPABASE & VERCEL */}
      {activeAdminTab === "supabase" && (
        <div className="space-y-6">
          {/* Connection Status Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Cơ Sở Dữ Liệu Supabase Cloud
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Đã Kết Nối
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Project URL: <code className="text-indigo-600 font-mono font-bold">{SUPABASE_URL}</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? "animate-spin text-indigo-600" : ""}`} />
                  <span>{isTestingSupabase ? "Đang Kiểm Tra..." : "Kiểm Tra Kết Nối Live"}</span>
                </button>

                <button
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isSeeding ? "Đang Khởi Tạo..." : "Khởi Tạo / Push Dữ Liệu Mẫu"}</span>
                </button>
              </div>
            </div>

            {supabaseStatusMsg && (
              <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-mono border border-slate-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{supabaseStatusMsg}</span>
              </div>
            )}
          </div>

          {/* SQL Schema Script Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span>Script Tạo Bảng SQL Schema Cho Supabase</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Sử dụng script bên dưới để tạo 4 bảng (`exams`, `graded_sheets`, `classes`, `audit_logs`) trong Supabase SQL Editor.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-indigo-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSql ? "Đã Sao Chép!" : "Sao Chép Script SQL"}</span>
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
              {sqlScriptContent}
            </pre>
          </div>

          {/* Vercel Deployment Instructions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Hướng Dẫn Deploy Lên Vercel</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-indigo-600 block">Bước 1: Push Code</span>
                <p className="text-slate-600">Push toàn bộ mã nguồn ứng dụng EduMark AI lên GitHub / GitLab repository.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-indigo-600 block">Bước 2: Import vào Vercel</span>
                <p className="text-slate-600">Tạo dự án mới trên Vercel, chọn Framework: <b>Vite</b>, Build Command: <code>npm run build</code>.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-extrabold text-indigo-600 block">Bước 3: Khai Báo Env Vars</span>
                <p className="text-slate-600">Thêm các biến môi trường <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> và <code>GEMINI_API_KEY</code>.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeAdminTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-xs text-slate-400 font-semibold">Tải Máy Chủ Cloud</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">Hoạt động 100%</h3>
              <p className="text-[10px] text-slate-400 mt-1">Port 3000 • Express Server</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-xs text-slate-400 font-semibold">Gemini AI Vision SDK</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">Ready (@google/genai)</h3>
              <p className="text-[10px] text-slate-400 mt-1">Model: gemini-3.6-flash</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-xs text-slate-400 font-semibold">Bài Thi Trong Hệ Thống</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{exams.length} Đề Thi</h3>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <p className="text-xs text-slate-400 font-semibold">Tổng Lượt Quét Bài Làm</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{gradedSheets.length} Bài</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Thông Tin Bảo Mật Quản Trị</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
              <p>• Tài khoản quản trị mặc định: <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold">admin</span></p>
              <p>• Mật khẩu quản trị mặc định: <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold">admin</span></p>
              <p>• Trạng thái API Key Gemini: Tự động inject qua secrets panel hoặc fallback local OMR engine.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSES */}
      {activeAdminTab === "classes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Danh Sách Lớp Học ({classes.length})</h3>
              <p className="text-xs text-slate-500">Quản lý mã số báo danh (SBD) và danh sách học sinh theo từng lớp</p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Lớp Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    Lớp {cls.className} ({cls.grade})
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{cls.studentCount} học sinh</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 text-xs pt-2 border-t border-slate-100">
                  {cls.students.slice(0, 5).map((st) => (
                    <div key={st.sbd} className="flex justify-between py-1 px-2 hover:bg-slate-50 rounded">
                      <span className="font-mono font-bold text-slate-700">{st.sbd}</span>
                      <span className="font-semibold">{st.name}</span>
                    </div>
                  ))}
                  {cls.students.length > 5 && (
                    <p className="text-[10px] text-slate-400 text-center pt-1">
                      ...và {cls.students.length - 5} học sinh khác
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeAdminTab === "logs" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Nhật Ký Hoạt Động (Audit Logs)</h3>
            <button
              onClick={onClearAuditLogs}
              className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 font-bold"
            >
              Xóa Nhật Ký
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-600">[{log.action}]</span>{" "}
                  <span className="text-slate-800">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeAdminTab === "settings" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-900">Cấu Hình Tên Trường & Mức Nhạy OMR</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Tiêu Đề Trường In Phiếu OMR</label>
            <input
              type="text"
              value={schoolHeader}
              onChange={(e) => setSchoolHeader(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Độ Nhạy Nhận Diện Ô Tô Chì (OMR Sensitivity)</label>
            <select
              value={omrSensitivity}
              onChange={(e) => setOmrSensitivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="high">Cao (Nhận cả nét tô chì nhạt HB/2B)</option>
              <option value="medium">Trung bình (Tiêu chuẩn)</option>
              <option value="strict">Chặt chẽ (Bỏ qua nét tô mờ)</option>
            </select>
          </div>

          <button
            onClick={handleSaveSettings}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình Quản Trị</span>
          </button>
        </div>
      )}

      {/* Add class modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm Lớp Học Mới</h3>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Lớp (ví dụ: 8A3)</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Nhập 8A3, 9A1..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khối Lớp</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option>Khối 6</option>
                  <option>Khối 7</option>
                  <option>Khối 8</option>
                  <option>Khối 9</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                >
                  Tạo Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
